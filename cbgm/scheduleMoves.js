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
      _.each(req.partitionModelStates, function(state) {
          _.each(partitionMapEnd.nodes, function(node) {
              planNode(partitionId, partitionEnd, partitionBeg, state.name, node);
            });
        });
    });

  function planNode(partitionId, partitionEnd, partitionBeg, stateName, node) {
    var endStateName = nodeState(partitionEnd, node);
    if (endStateName != stateName) {
      return;
    }
    var curStateName = nodeState(partitionBeg, node);
    while (curStateName != endStateName) {
      var prevStateName = curStateName;
      curStateName = req.mapState[curStateName].transitions[endStateName];
      schedule.push([ partitionId, node, prevStateName, curStateName ]);
    }
  }

  function nodeState(partition, node) {
    for (var state in partition) {
      if (_.contains(partition[state], node)) {
        return state;
      }
    }
    return "null";
  }
}
