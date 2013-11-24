function rebalance() {
  return run([validatePartitionSettings,
              planNewRebalanceMap,
              actualizeNewMap]);
}
function failOver() {
  return run([validatePartitionSettings,
              planNewFailOverMap,
              actualizeNewMap]);
}
function restoreBack() {
  return run([validatePartitionSettings,
              planNewRestoreBackMap,
              actualizeNewMap]);
}
function actualizeNewMap() {
  return run([validatePartitionSettings,
              validateNewMap,
              scheduleSteps,
              executeSteps,
              checkHealth]);
}
function cancelRebalance() {
  return run([cancelTakeOverSteps,
              takeCurrentMapAsNewMap,
              actualizeNewMap]);
}
function checkHealth() {
}
function validatePartitionSettings() {
}
function planNewRebalanceMap() {
}
function planNewFailOverMap() {
}
function planNewRestoreBackMap() {
}
function validateNewMap() {
}
function scheduleSteps() {
}
function executeSteps() {
}
function cancelTakeOverSteps() {
}
function takeCurrentMapAsNewMap() {
}
