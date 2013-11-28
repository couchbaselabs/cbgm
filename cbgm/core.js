/* Core rebalance algorithms, no UI. */

function rebalance(ctx, req) {
  return run(ctx, req,
             validatePartitionSettings,
             allocNewMap,
             planNewRebalanceMap,
             actualizeNewMap);
}
function failOver(ctx, req) {
  return run(ctx, req,
             validatePartitionSettings,
             allocNewMap,
             planNewFailOverMap,
             actualizeNewMap);
}
function restoreBack(ctx, req) {
  return run(ctx, req,
             validatePartitionSettings,
             allocNewMap,
             planNewRestoreBackMap,
             actualizeNewMap);
}
function cancelRebalance(ctx, req) {
  return run(ctx, req,
             cancelTakeOverSteps,
             takeCurrentMapAsNewMap,
             actualizeNewMap);
}
function actualizeNewMap(ctx, req) {
  return run(ctx, req,
             validateNewMap,
             scheduleSteps,
             executeSteps,
             checkHealth);
}

// --------------------------------------------------------

function validatePartitionSettings(ctx, req) {
  req.nextBucketEvents = _.clone(req.prevBucketEvents);
  req.nextBucketEvents.events = sortDesc(req.nextBucketEvents.events || [],
                                         "when");

  req.lastPartitionMap = _.findWhere(req.nextBucketEvents.events,
                                     { class: "partitionMap" });
  if (req.lastPartitionMap) {
    req.lastPartitionMapPartitions =
      partitionsWithNodeNames(req.lastPartitionMap.partitions,
                              req.lastPartitionMap.nodes);
  }

  req.arrNodes = { want: req.wantPartitionParams.nodes };
  req.mapNodes = {};

  req.lastPartitionParams = _.findWhere(req.nextBucketEvents.events,
                                        { class: "partitionParams" });
  if (req.lastPartitionParams) {
    req.err =
      _.reduce(["keyFunc", "assignment", "numPartitions"], function(r, k) {
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
    req.arrNodes.same =
      _.intersection(req.lastPartitionParams.nodes, req.wantPartitionParams.nodes);
  } else {
    req.arrNodes.added   = req.wantPartitionParams.nodes;
    req.arrNodes.removed = [];
    req.arrNodes.same    = [];
  }
  _.each(req.arrNodes, function(a, k) { req.mapNodes[k] = arrToMap(a); });
  function arrToMap(a) {
    return _.reduce(a, function(m, k) { m[k] = {}; return m; }, {});
  }

  req.partitionModel =
    ctx.getObj("partitionModel-" + req.wantPartitionParams.assignment).result;
  if (!req.partitionModel) {
    req.err = "error: missing partitionModel-" + req.wantPartitionParams.assignment;
    return;
  }
  req.partitionModelStates =
    sortDesc(_.reduce(req.partitionModel.states,
                      function(a, v, k) {
                        a.push(_.defaults(_.clone(v), { name: k }));
                        return a;
                      }, []),
             "priority");
}

// Converts node indexes to node names.  Example, with "nodes": ["a", "b"]:
//   before - "partitions": { "0": { "master": [0], "slave": [1] }, ... }
//   after  - "partitions": { "0": { "master": ["a"], "slave": ["b"] }, ... }
// Reverse of partitionsWithNodeIndexes().
function partitionsWithNodeNames(partitions, nodes) {
  return partitionsMap(partitions,
                       function(nodeIdx) { return nodes[nodeIdx]; });
}

// Converts node names to indexes.  Example, with "nodes": ["a", "b"]:
//   before - "partitions": { "0": { "master": ["a"], "slave": ["b"] }, ... }
//   after  - "partitions": { "0": { "master": [0], "slave": [1] }, ... }
// Reverse of partitionsWithNodeNames().
function partitionsWithNodeIndexes(partitions, nodes) {
  return partitionsMap(partitions,
                       function(nodeName) { return _.indexOf(nodes, nodeName); });
}

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

function allocNewMap(ctx, req) {
  req.nextPartitionMap =
    ctx.newObj("partitionMap",
               _.omit(req.wantPartitionParams, "class")).result;
  req.nextPartitionMap.partitions =
    keyFunc[req.wantPartitionParams.keyFunc].allocPartitions(req);
}

function planNewRebalanceMap(ctx, req) {
  // TODO: maintenance mode & swap rebalance detected as part of rebalance.

  var lastPartitions = req.lastPartitionMapPartitions || {};
  var nextPartitions = // Remove nodes that need to be removed.
    _.object(_.map(req.nextPartitionMap.partitions,
                   function(partition, partitionId) {
                     var lastPartition = lastPartitions[partitionId] || {};
                     var nextPartition =
                       _.object(_.map(lastPartition,
                                      function(nodes, state) {
                                        return [state,
                                                _.difference(nodes,
                                                             req.arrNodes.removed)];
                                      }));
                     return [partitionId, nextPartition];
                   }));

  _.each(req.partitionModelStates,
         function(pms) {
           var constraints =
             parseInt((req.wantPartitionParams.constraints || {})[pms.name]) ||
             parseInt(pms.constraints);
           if (constraints >= 0) {
             planWithPMSConstraints(pms, constraints);
           }
         });

  function planWithPMSConstraints(pms, constraints) {
    var state = pms.name;
    req.nextPartitionMap.partitions =
      _.object(_.map(nextPartitions,
                     function(partition, partitionId) {
                       return [partitionId, partition];
                     }));
  }

  req.nextPartitionMap.partitions = nextPartitions;
  req.nextPartitionMap.partitions =
    partitionsWithNodeIndexes(req.nextPartitionMap.partitions,
                              req.nextPartitionMap.nodes);

  // TODO: mark partitions on removed node as dead.
}

function planNewFailOverMap(ctx, req) {
}

function planNewRestoreBackMap(ctx, req) {
}

function validateNewMap(ctx, req) {
  req.nextBucketEvents.events.unshift(req.wantPartitionParams);
  req.nextBucketEvents.events.unshift(req.nextPartitionMap);
}

function scheduleSteps(ctx, req) {
}

function executeSteps(ctx, req) {
}

function cancelTakeOverSteps(ctx, req) {
}

function takeCurrentMapAsNewMap(ctx, req) {
}

function checkHealth(ctx, req) {
}

// --------------------------------------------------------

function run(ctx, req) { // Varargs are steps to apply to req as long as no req.err.
  return _.reduce(_.rest(arguments, 2),
                  function(req, step) {
                    return req.err ? req : step(ctx, req) || req;
                  }, req);
}

function sortDesc(a, field) { return _.sortBy(a, field).reverse(); }
