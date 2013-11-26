/* Core rebalance algorithms, no UI. */

function rebalance(req) {
  // TODO: maintenance mode & swap rebalance detected as part of rebalance.
  return run(req,
             validatePartitionSettings,
             planNewRebalanceMap,
             actualizeNewMap);
}
function failOver(req) {
  return run(req,
             validatePartitionSettings,
             planNewFailOverMap,
             actualizeNewMap);
}
function restoreBack(req) {
  return run(req,
             validatePartitionSettings,
             planNewRestoreBackMap,
             actualizeNewMap);
}
function cancelRebalance(req) {
  return run(req,
             cancelTakeOverSteps,
             takeCurrentMapAsNewMap,
             actualizeNewMap);
}
function actualizeNewMap(req) {
  return run(req,
             validatePartitionSettings,
             validateNewMap,
             scheduleSteps,
             executeSteps,
             checkHealth);
}
function validatePartitionSettings(req) {
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
  }
}
function planNewRebalanceMap(req) {
  console.log(req);
}
function planNewFailOverMap(req) {
}
function planNewRestoreBackMap(req) {
}
function validateNewMap(req) {
}
function scheduleSteps(req) {
}
function executeSteps(req) {
}
function cancelTakeOverSteps(req) {
}
function takeCurrentMapAsNewMap(req) {
}
function checkHealth(req) {
}
function run(req) { // Rest of arguments are steps to apply to req as long as no req.err.
  return _.reduce(_.rest(arguments),
                  function(req, step) { return req.err ? req : step(req) || req; }, req);
}
function sortDesc(a, field) { return _.sortBy(a, field).reverse(); }
