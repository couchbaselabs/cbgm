function rebalance(req) {
  // Maintenance mode and swap rebalance are detected as part of regular rebalance?
  return run([validatePartitionSettings,
              planNewRebalanceMap,
              actualizeNewMap], req);
}
function failOver(req) {
  return run([validatePartitionSettings,
              planNewFailOverMap,
              actualizeNewMap], req);
}
function restoreBack(req) {
  return run([validatePartitionSettings,
              planNewRestoreBackMap,
              actualizeNewMap], req);
}
function cancel(req) {
  return run([cancelTakeOverSteps,
              takeCurrentMapAsNewMap,
              actualizeNewMap], req);
}
function actualizeNewMap(req) {
  return run([validatePartitionSettings,
              validateNewMap,
              scheduleSteps,
              executeSteps,
              checkHealth], req);
}
function run(steps, req) {
  return _.reduce(steps, function(err, step) { return err || step(req); });
}
function checkHealth(req) {
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
