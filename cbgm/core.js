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
function cancel(req) {
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
function run(req) { // Rest of arguments are steps to apply to req as long as no req.err.
  return _.reduce(_.rest(arguments),
                  function(req, step) { return req.err ? req : step(req) || req; }, req);
}
function validatePartitionSettings(req) {
}
function planNewRebalanceMap(req) {
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
