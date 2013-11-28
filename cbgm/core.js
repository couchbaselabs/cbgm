/* Core rebalance algorithms, no UI. */

function rebalance(ctx, req) {
  return run(ctx, req,
             validatePartitionSettings,
             allocNextMap,
             planNextRebalanceMap,
             actualizeNextMap);
}
function failOver(ctx, req) {
  return run(ctx, req,
             validatePartitionSettings,
             allocNextMap,
             planNextFailOverMap,
             actualizeNextMap);
}
function restoreBack(ctx, req) {
  return run(ctx, req,
             validatePartitionSettings,
             allocNextMap,
             planNextRestoreBackMap,
             actualizeNextMap);
}
function cancelRebalance(ctx, req) {
  return run(ctx, req,
             cancelTakeOverSteps,
             takeCurrentMapAsNextMap,
             actualizeNextMap);
}

// --------------------------------------------------------

function validatePartitionSettings(ctx, req) {
  req.nextBucketEvents = _.clone(req.prevBucketEvents);
  req.nextBucketEvents.events = sortDesc(req.nextBucketEvents.events || [],
                                         "when");

  req.lastPartitionMap = _.findWhere(req.nextBucketEvents.events,
                                     { class: "partitionMap" });
  if (req.lastPartitionMap) {
    req.lastPartitions = partitionsWithNodeNames(req.lastPartitionMap.partitions,
                                                 req.lastPartitionMap.nodes);
  }

  req.arrNodes = { want: req.wantPartitionParams.nodes };
  req.mapNodes = {};

  req.lastPartitionParams = _.findWhere(req.nextBucketEvents.events,
                                        { class: "partitionParams" });
  if (req.lastPartitionParams) {
    req.err =
      _.reduce(["keyFunc", "model", "numPartitions"], function(r, k) {
          if (req.lastPartitionParams[k] != req.wantPartitionParams[k]) {
            return "partitionParams." + k + " not equal: " +
              req.lastPartitionParams[k] + " vs " + req.wantPartitionParams[k];
          }
          return r;
        }, null);
    if (req.err) {
      return;
    }

    req.arrNodes.added =
      _.difference(req.wantPartitionParams.nodes, req.lastPartitionParams.nodes);
    req.arrNodes.removed =
      _.difference(req.lastPartitionParams.nodes, req.wantPartitionParams.nodes);
  } else {
    req.arrNodes.added   = req.wantPartitionParams.nodes;
    req.arrNodes.removed = [];
  }
  _.each(req.arrNodes, function(a, k) { req.mapNodes[k] = arrToMap(a); });
  function arrToMap(a) {
    return _.reduce(a, function(m, k) { m[k] = {}; return m; }, {});
  }

  req.partitionModel =
    ctx.getObj("partitionModel-" + req.wantPartitionParams.model).result;
  if (!req.partitionModel) {
    req.err = "error: missing partitionModel-" + req.wantPartitionParams.model;
    return;
  }
  req.partitionModelStates =
    sortDesc(_.reduce(req.partitionModel.states,
                      function(a, v, k) {
                        a.push(_.defaults(_.clone(v), { name: k }));
                        return a;
                      }, []),
             "priority");
  req.mapStatePriority = // Key is state name (e.g., "master"), val is priority int.
    _.reduce(req.partitionModel.states,
             function(m, partitionModel, name) {
               m[name] = partitionModel.priority;
               return m;
             }, {});
}

function allocNextMap(ctx, req) {
  req.nextPartitionMap =
    ctx.newObj("partitionMap", _.omit(req.wantPartitionParams, "class")).result;
  req.nextPartitionMap.partitions =
    keyFunc[req.wantPartitionParams.keyFunc].allocPartitions(req);
  req.nextPartitionMapNumPartitions =
    _.size(req.nextPartitionMap.partitions);
}

function planNextRebalanceMap(ctx, req) {
  return planNextMap(ctx, req);
}

function planNextFailOverMap(ctx, req) {
  return planNextMap(ctx, req);
}

function planNextRestoreBackMap(ctx, req) {
  return planNextMap(ctx, req);
}

function planNextMap(ctx, req) {
  // TODO: maintenance mode & swap rebalance detected as part of rebalance.

  // Remove nodes that user wants to be removed.
  var lastPartitions = req.lastPartitions || {};
  var nextPartitions =
    _.object(_.map(req.nextPartitionMap.partitions,
                   function(partition, partitionId) {
                     var lastPartition = lastPartitions[partitionId] || {};
                     var nextPartition = removeNodesFromPartition(lastPartition,
                                                                  req.arrNodes.removed);
                     return [partitionId, nextPartition];
                   }));

  req.stateNodeCountsBeg = countStateNodes(nextPartitions);
  req.stateNodeCountsCur = countStateNodes(nextPartitions);

  // Run through the sorted partition states (master, slave, etc) that
  // have constraints and invoke assignStateToPartitions().
  _.each(req.partitionModelStates,
         function(s) {
           var constraints =
             parseInt((req.wantPartitionParams.constraints || {})[s.name]) ||
             parseInt(s.constraints);
           if (constraints >= 0) {
             assignStateToPartitions(s.name, constraints);
           }
         });

  // Given a state and its constraints, for every partition, find and
  // assign the best nodes to that state.
  function assignStateToPartitions(state, constraints) {
    // The order that we visit the partitions can help us reach a
    // better assignment.
    var partitionIds = _.keys(nextPartitions).sort();
    partitionIds = _.sortBy(partitionIds, function(partitionId) {
        var lastPartition = lastPartitions[partitionId] || {};
        // First, visit partitions assigned to nodes that are
        // scheduled to be removed.
        if (!_.isEmpty(_.intersection(lastPartition[state],
                                      req.arrNodes.removed))) {
          return -1;
        }
        return 0;
      });

    nextPartitions =
      _.object(_.map(partitionIds,
                     function(partitionId) {
                       var partition = nextPartitions[partitionId];
                       var nodesToAssign =
                         findBestNodes(partitionId, partition, state, constraints);
                       partition = removeNodesFromPartition(partition,
                                                            partition[state],
                                                            decStateNodeCountsCur);
                       partition = removeNodesFromPartition(partition,
                                                            nodesToAssign,
                                                            decStateNodeCountsCur);
                       partition[state] = nodesToAssign;
                       incStateNodeCountsCur(state, nodesToAssign);
                       return [partitionId, partition];
                     }));
  }

  function findBestNodes(partitionId, partition, state, constraints) {
    var stateNodeCounts =
      req.stateNodeCountsCur[state] =
      req.stateNodeCountsCur[state] || {};
    var statePriority = req.mapStatePriority[state];
    var candidateNodes = req.nextPartitionMap.nodes;
    _.each(partition,
           function(sNodes, s) {
             // Filter out or don't touch nodes at a higher priority state.
             // E.g., if we're assigning slaves, leave the masters untouched.
             if (req.mapStatePriority[s] > statePriority) {
               candidateNodes = _.difference(candidateNodes, sNodes);
             }
           });
    candidateNodes = _.sortBy(candidateNodes, scoreNode);
    return candidateNodes.slice(0, constraints);

    function scoreNode(node) {
      var isCurrent = _.contains(partition[state], node);
      var currentFactor = isCurrent ? -1 : 0;
      var r = stateNodeCounts[node] || 0;
      r = r + currentFactor;
      return r;
    }
  }

  function incStateNodeCountsCur(state, nodes) {
    adjustStateNodeCounts(req.stateNodeCountsCur, state, nodes, 1);
  }
  function decStateNodeCountsCur(state, nodes) {
    adjustStateNodeCounts(req.stateNodeCountsCur, state, nodes, -1);
  }

  function adjustStateNodeCounts(stateNodeCounts, state, nodes, amt) {
    _.each(nodes, function(n) {
        var s = stateNodeCounts[state] = stateNodeCounts[state] || {};
        s[n] = (s[n] || 0) + amt;
        if (s[n] < 0) {
          console.log("ERROR: adjustStateNodeCounts < 0" +
                      ", state: " + state + " node: " + n + " s[n]: " + s[n]);
        }
        if (s[n] > req.nextPartitionMapNumPartitions) {
          console.log("ERROR: adjustStateNodeCounts < numPartitions" +
                      ", state: " + state + " node: " + n + " s[n]: " + s[n]);
        }
      });
  }

  req.stateNodeCountsCur = countStateNodes(nextPartitions);

  req.nextPartitionMap.partitions = nextPartitions;
  req.nextPartitionMap.partitions =
    partitionsWithNodeIndexes(req.nextPartitionMap.partitions,
                              req.nextPartitionMap.nodes);

  // TODO: mark partitions on removed node as dead.
}

function actualizeNextMap(ctx, req) {
  // TODO: do real validation here.
  req.nextBucketEvents.events.unshift(req.wantPartitionParams);
  req.nextBucketEvents.events.unshift(req.nextPartitionMap);
}

function cancelTakeOverSteps(ctx, req) {
}

function takeCurrentMapAsNextMap(ctx, req) {
}

function checkHealth(ctx, req) {
}

// --------------------------------------------------------

// Returns partition with nodes removed.  Example, when removeNodes == ["a"],
//   before - partition: {"0": { "master": ["a"], "slave": ["b"] } }
//   after  - partition: {"0": { "master": [], "slave": ["b"] } }
function removeNodesFromPartition(partition, removeNodes, cb) {
  return _.object(_.map(partition,
                        function(partitionNodes, state) {
                          if (cb) {
                            cb(state, _.intersection(partitionNodes, removeNodes));
                          }
                          return [state, _.difference(partitionNodes, removeNodes)];
                        }));
}

// Converts node indexes to node names.  Example, with "nodes": ["a", "b"]:
//   before - "partitions": { "0": { "master": [0], "slave": [1] }, ... }
//   after  - "partitions": { "0": { "master": ["a"], "slave": ["b"] }, ... }
// Reverse of partitionsWithNodeIndexes().
function partitionsWithNodeNames(partitions, nodes) {
  return partitionsMap(partitions,
                       function(nodeIdx) { return nodes[nodeIdx]; });
}

// Converts node names to indexes.  Example, with node" == ["a", "b"]:
//   before - partitions: { "0": { "master": ["a"], "slave": ["b"] }, ... }
//   after  - partitions: { "0": { "master": [0], "slave": [1] }, ... }
// Reverse of partitionsWithNodeNames().
function partitionsWithNodeIndexes(partitions, nodes) {
  return partitionsMap(partitions,
                       function(nodeName) { return _.indexOf(nodes, nodeName); });
}

// Like map(), but runs f() on every nodes array in the partition.
// Example, with partitions == { "0": { "master": ["a"], "slave": ["b", "c"] } }
// then you'll see f(["a"]) and f(["b", "c"]).
function partitionsMap(partitions, f) {
  return _.object(_.map(partitions,
                        function(partition, partitionId) {
                          return [partitionId,
                                  _.object(_.map(partition,
                                                 function(arr, state) {
                                                   return [state, _.map(arr, f)];
                                                 }))];
                        }));
}

// Example, with partitions of...
//   { "0": { "master": ["a"], "slave": ["b", "c"] } },
//   { "1": { "master": ["b"], "slave": ["c"] } }
// then return value will be...
//   { "master": { "a": 1, "b": 1 } },
//   { "slave": { "b": 1, "c": 2 } }
function countStateNodes(partitions) {
  return _.reduce(partitions, function(r, partition, partitionId) {
      return _.reduce(partition, function(r, nodes, state) {
          _.each(nodes, function(node) {
              var s = r[state] = r[state] || {};
              s[node] = (s[node] || 0) + 1;
            });
          return r;
        }, r);
    }, {});
}

// --------------------------------------------------------

function run(ctx, req) { // Varargs are steps to apply to req as long as no req.err.
  return _.reduce(_.rest(arguments, 2),
                  function(req, step) {
                    return req.err ? req : step(ctx, req) || req;
                  }, req);
}

function sortDesc(a, field) { return _.sortBy(a, field).reverse(); }
