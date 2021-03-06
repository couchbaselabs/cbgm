/* Core partition rebalance algorithms, no UI. */

function rebalanceMap(ctx, req) {
  return run(ctx, req,
             initPartitionModel,
             validatePartitionSettings,
             allocNextMap,
             planNextMap,
             validateNextMap);
}

function validatePartitionSettings(ctx, req) {
  req.nextResourceEvents = _.clone(req.prevResourceEvents);
  req.nextResourceEvents.events =
    sortDesc(req.nextResourceEvents.events || [], "when");

  req.lastPartitionParams = _.findWhere(req.nextResourceEvents.events,
                                        { class: "partitionParams" });
  if (req.lastPartitionParams) {
    req.err = _.reduce(["keyFunc", "model", "numPartitions"], function(r, k) {
        if (req.lastPartitionParams[k] != req.wantPartitionParams[k]) {
          return "partitionParams." + k + " not equal: " +
            req.lastPartitionParams[k] + " vs " + req.wantPartitionParams[k];
        }
        return r;
      }, null);
    if (req.err) {
      return;
    }
  }

  req.lastPartitionMap = _.findWhere(req.nextResourceEvents.events,
                                     { class: "partitionMap" });
  if (req.lastPartitionMap) {
    req.lastPartitions = partitionsWithNodeNames(req.lastPartitionMap.partitions,
                                                 req.lastPartitionMap.nodes);
  }

  req.deltaNodes = { added: _.difference(req.wantPartitionParams.nodes,
                                         (req.lastPartitionParams || {}).nodes),
                     removed: _.difference((req.lastPartitionParams || {}).nodes,
                                           req.wantPartitionParams.nodes) };
}

function allocNextMap(ctx, req) {
  req.nextPartitionMap =
    ctx.newObj("partitionMap", _.omit(req.wantPartitionParams, "class")).result;
  req.nextPartitionMap.partitions =
    resourceKeyFunc[req.wantPartitionParams.keyFunc].allocPartitions(req);
  req.nextPartitionMapNumPartitions =
    _.size(req.nextPartitionMap.partitions);
}

function planNextMap(ctx, req) {
  // Start by filling out nextPartitions same as lastPartitions, but
  // filter out the to-be-removed nodes.
  var lastPartitions = req.lastPartitions || {};
  var nextPartitions =
    _.object(_.map(req.nextPartitionMap.partitions, function(_, partitionId) {
          var lastPartition = lastPartitions[partitionId] || {};
          var nextPartition = removeNodesFromPartition(lastPartition,
                                                       req.deltaNodes.removed);
          return [partitionId, nextPartition];
        }));

  req.partitionWeights = req.nextPartitionMap.partitionWeights || {};
  req.stateNodeCounts = countStateNodes(nextPartitions, req.partitionWeights);
  req.hierarchy = req.nextPartitionMap.hierarchy;
  req.hierarchyRules = req.nextPartitionMap.hierarchyRules || {};
  req.hierarchyChildren = mapParentsToMapChildren(req.hierarchy);
  var zeroesL = "0000000000000";
  var zeroesS = "0000";

  // Run through the sorted partition states (master, slave, etc) that
  // have constraints and invoke assignStateToPartitions().
  _.each(req.partitionModelStates, function(s) {
      var constraints =
        parseInt((req.wantPartitionParams.constraints || {})[s.name]) ||
        parseInt(s.constraints) || 0;
      if (constraints >= 0) {
        assignStateToPartitions(s.name, constraints);
      }
    });

  // Given a state and its constraints, for every partition, assign nodes.
  function assignStateToPartitions(state, constraints) {
    // Sort the partitions to help reach a better assignment.
    var partitionIds =
      _.sortBy(_.sortBy(_.keys(nextPartitions), zeroPrefix), function(partitionId) {
          var pid = zeroPrefix(partitionId);
          // Secondary sort by partitionWeight.
          var pw = String(parseInt("1" + zeroesS) -
                          (req.partitionWeights[partitionId] || 1));
          var pwz = zeroesS.slice(0, zeroesS.length - pw.length) + pw;
          // First, favor partitions on nodes that are to-be-removed.
          var lastPartition = lastPartitions[partitionId] || {};
          if (!_.isEmpty(_.intersection(lastPartition[state],
                                        req.deltaNodes.removed))) {
            return "0." + pwz + "." + pid;
          }
          // Then, favor partitions who haven't been assigned to any
          // newly added nodes yet for any state.
          if (_.isEmpty(_.intersection(_.flatten(_.values(nextPartitions[partitionId])),
                                       req.deltaNodes.added))) {
            return "1." + pwz + "." + pid;
          }
          return "2." + pwz + "." + pid;
        });

    function zeroPrefix(s) {
      if (s == String(parseInt(s))) {
        return zeroesL.slice(0, zeroesL.length - s.length) + s;
      }
      return s;
    }

    // Key is higherPriorityNode, val is { lowerPriorityNode: count }.
    req.nodeToNodeCounts = {};

    nextPartitions =
      _.object(_.map(partitionIds, function(partitionId) {
            var partition = nextPartitions[partitionId];
            var partitionWeight = req.partitionWeights[partitionId] || 1;
            var nodesToAssign = findBestNodes(partitionId, partition,
                                              state, constraints);
            partition = removeNodesFromPartition(partition,
                                                 partition[state],
                                                 decStateNodeCounts);
            partition = removeNodesFromPartition(partition,
                                                 nodesToAssign,
                                                 decStateNodeCounts);
            partition[state] = nodesToAssign;
            incStateNodeCounts(state, nodesToAssign);
            return [partitionId, partition];

            function incStateNodeCounts(state, nodes) {
              adjustStateNodeCounts(req.stateNodeCounts, state, nodes,
                                    partitionWeight);
            }
            function decStateNodeCounts(state, nodes) {
              adjustStateNodeCounts(req.stateNodeCounts, state, nodes,
                                    -partitionWeight);
            }
          }));
  }

  function findBestNodes(partitionId, partition, state, constraints) {
    var stickiness =
      req.partitionWeights[partitionId] || (req.stickiness || {})[state] || 1.5;
    var nodeWeights = req.nextPartitionMap.nodeWeights || {};
    var statePriority = req.mapState[state].priority;
    var stateNodeCounts =
      req.stateNodeCounts[state] =
      req.stateNodeCounts[state] || {};
    var nodePartitionCounts =
      _.reduce(req.stateNodeCounts, function(r, nodeCounts) {
          _.each(nodeCounts, function(count, node) {
              r[node] = (r[node] || 0) + count;
            });
          return r;
        }, {});
    var highestPriorityState = req.partitionModelStates[0].name;
    var highestPriorityNode = _.first(partition[highestPriorityState]);

    var candidateNodes =
      _.sortBy(excludeHigherPriorityNodes(req.nextPartitionMap.nodes),
               scoreNode);

    var hierarchyNodes = [];
    _.each(req.hierarchyRules[state], function(stateHierarchyRule) {
        var hierarchyCandidates =
          includeExcludeNodes(highestPriorityNode || hierarchyNodes[0],
                              stateHierarchyRule.includeLevel || 0,
                              stateHierarchyRule.excludeLevel || 0,
                              req.hierarchy,
                              req.hierarchyChildren);
        hierarchyCandidates =
          _.sortBy(excludeHigherPriorityNodes(_.intersection(hierarchyCandidates,
                                                             req.nextPartitionMap.nodes)),
                   scoreNode);
        hierarchyNodes.push(_.first(hierarchyCandidates) || candidateNodes[0]);
      });

    candidateNodes = _.uniq(hierarchyNodes.concat(candidateNodes));
    candidateNodes = candidateNodes.slice(0, constraints);
    if (candidateNodes.length < constraints) {
      req.warnings.push("warning: could not meet constraints: " + constraints +
                        ", state: " + state +
                        ", partitionId: " + partitionId);
    }

    _.each(candidateNodes, function(candidateNode) {
        var m = req.nodeToNodeCounts[highestPriorityNode] =
          req.nodeToNodeCounts[highestPriorityNode] || {};
        m[candidateNode] = (m[candidateNode] || 0) + 1;
      });

    return candidateNodes;

    function excludeHigherPriorityNodes(nodes) {
      // Filter out nodes of a higher priority state; e.g., if
      // we're assigning slaves, leave the masters untouched.
      _.each(partition, function(sNodes, state) {
          if (req.mapState[state].priority > statePriority) {
            nodes = _.difference(nodes, sNodes);
          }
        });
      return nodes;
    }

    function scoreNode(node) {
      var numPartitions = req.nextPartitionMapNumPartitions * 1.0;
      var lowerPriorityBalanceFactor =
        ((req.nodeToNodeCounts[highestPriorityNode] || {})[node] || 0) /
        numPartitions;
      var filledFactor =
        0.001 * (nodePartitionCounts[node] || 0) /
        numPartitions;
      var currentFactor = _.contains(partition[state], node) ? stickiness : 0;

      var r = stateNodeCounts[node] || 0;
      r = r + lowerPriorityBalanceFactor;
      r = r + filledFactor;
      var w = nodeWeights[node] || 0;
      if (w > 0) {
        r = r / (1.0 * w);
      }
      r = r - currentFactor;
      return r;
    }
  }

  function adjustStateNodeCounts(stateNodeCounts, state, nodes, amt) {
    _.each(nodes, function(n) {
        var s = stateNodeCounts[state] = stateNodeCounts[state] || {};
        s[n] = (s[n] || 0) + amt;
        if (s[n] < 0) {
          console.log("ERROR: adjustStateNodeCounts out of range" +
                      ", state: " + state + " node: " + n + " s[n]: " + s[n]);
        }
      });
  }

  req.nextPartitionMap.partitions = nextPartitions;
  req.nextPartitionMap.partitions =
    partitionsWithNodeIndexes(req.nextPartitionMap.partitions,
                              req.nextPartitionMap.nodes);
}

function validateNextMap(ctx, req) {
  // TODO: do real validation here.
  req.nextResourceEvents.events.unshift(req.wantPartitionParams);
  req.nextResourceEvents.events.unshift(req.nextPartitionMap);
}

// Example, with partitions of...
//   { "0": { "master": ["a"], "slave": ["b", "c"] },
//     "1": { "master": ["b"], "slave": ["c"] } }
// then return value will be...
//   { "master": { "a": 1, "b": 1 },
//     "slave": { "b": 1, "c": 2 } }
function countStateNodes(partitions, partitionWeights) {
  partitionWeights = partitionWeights || {};
  return _.reduce(partitions, function(r, partition, partitionId) {
      return _.reduce(partition, function(r, nodes, state) {
          _.each(nodes, function(node) {
              var s = r[state] = r[state] || {};
              s[node] = (s[node] || 0) + (partitionWeights[partitionId] || 1);
            });
          return r;
        }, r);
    }, {});
}
