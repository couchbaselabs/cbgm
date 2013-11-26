/* Core rebalance algorithms, no UI. */

function rebalance(ctx, req) {
  // TODO: maintenance mode & swap rebalance detected as part of rebalance.
  return run(ctx, req,
             validatePartitionSettings,
             planNewRebalanceMap,
             actualizeNewMap);
}
function failOver(ctx, req) {
  return run(ctx, req,
             validatePartitionSettings,
             planNewFailOverMap,
             actualizeNewMap);
}
function restoreBack(ctx, req) {
  return run(ctx, req,
             validatePartitionSettings,
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
             validatePartitionSettings,
             validateNewMap,
             scheduleSteps,
             executeSteps,
             checkHealth);
}
function validatePartitionSettings(ctx, req) {
  req.nextBucketEvents = _.clone(req.prevBucketEvents);
  req.nextBucketEvents.events = sortDesc(req.nextBucketEvents.events || [], "when");

  req.lastPartitionParams =
    _.findWhere(req.nextBucketEvents.events, { class: "partitionParams" });
  req.lastPartitionMap =
    _.findWhere(req.nextBucketEvents.events, { class: "partitionMap" });

  if (req.lastPartitionParams) {
    req.err = _.reduce(["keyFunc", "assignment", "numPartitions"], function(memo, k) {
        if (req.lastPartitionParams[k] != req.wantPartitionParams[k]) {
          return "partitionParams." + k + " not equal: " +
            req.lastPartitionParams[k] + " vs " + req.wantPartitionParams[k];
        }
        return memo;
      }, null);
    req.arrNodesAdded =
      _.difference(req.wantPartitionParams.nodes, req.lastPartitionParams.nodes);
    req.arrNodesRemoved =
      _.difference(req.lastPartitionParams.nodes, req.wantPartitionParams.nodes);
    req.arrNodesSame =
      _.intersection(req.lastPartitionParams.nodes, req.wantPartitionParams.nodes);
  } else {
    req.arrNodesAdded = req.wantPartitionParams.nodes;
    req.arrNodesRemoved = [];
    req.arrNodesSame = [];
  }
  function mapAdd(m, k) { m[k] = {}; return m; }
  req.nodesAdded = _.reduce(req.arrNodesAdded, mapAdd, {});
  req.nodesRemoved = _.reduce(req.arrNodesRemoved, mapAdd, {});
  req.nodesSame = _.reduce(req.arrNodesSame, mapAdd, {});
}
function planNewRebalanceMap(ctx, req) {
  req.nextPartitionMap = ctx.newObj("partitionMap", req.wantPartitionParams).result;
}
function planNewFailOverMap(ctx, req) {
}
function planNewRestoreBackMap(ctx, req) {
}
function validateNewMap(ctx, req) {
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
function run(ctx, req) { // Rest of arguments are steps to apply to req as long as no req.err.
  return _.reduce(_.rest(arguments, 2),
                  function(req, step) { return req.err ? req : step(ctx, req) || req; }, req);
}
function sortDesc(a, field) { return _.sortBy(a, field).reverse(); }
