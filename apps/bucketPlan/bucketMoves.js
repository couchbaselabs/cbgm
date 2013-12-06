var moves = {
  "masterSlave": {
    "slave": {
      "master": function(schedule, partitionId, partitionEnd, partitionBeg, node) {
        var curMaster = _.first(partitionBeg["master"]);
        if (curMaster) {
          schedule.push([ partitionId, node, "slave", "master", "TAKEOVER", curMaster ]);
          partitionBeg["master"] = _.without(partitionBeg["master"], curMaster);
          partitionBeg["dead"] = (partitionBeg["dead"] || []).concat(curMaster);
        } else {
          schedule.push([ partitionId, node, "slave", "master" ]);
        }
      }
    }
  }
};
