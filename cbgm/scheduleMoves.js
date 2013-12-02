function scheduleMoves(ctx, req) {
  return run(ctx, req,
             initPartitionModel,
             planSchedule);
}

function planSchedule(ctx, req) {
  var schedule = req.schedule = [];
  var partitionMapEnd = req.partitionMapEnd || {};
  var partitionMapBeg = req.partitionMapBeg || {};
  var partitionMapEndPartitions = partitionsWithNodeNames(partitionMapEnd.partitions,
                                                          partitionMapEnd.nodes);
  var partitionMapBegPartitions = partitionsWithNodeNames(partitionMapBeg.partitions,
                                                          partitionMapBeg.nodes);
  _.each(partitionMapEndPartitions, function(partitionEnd, partitionId) {
      var partitionBeg = partitionMapBegPartitions[partitionId] || {};
      _.each(req.partitionModelStates, function(state, stateIndex) {
          var constraints =
            parseInt((req.wantPartitionParams.constraints || {})[state.name]) ||
            parseInt(state.constraints) || 0;
          schedule.push([ state.name, partitionEnd[state.name], partitionBeg[state.name] ]);
        })
    });
}
