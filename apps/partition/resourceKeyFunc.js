var resourceKeyFunc = {
  "identity": {
    allocPartitions: allocNumPartitions
  },
  "hash-crc32": {
    allocPartitions: allocNumPartitions
  },
  "range": {
    allocPartitions: function(req) {
      return _.reduce((req.lastPartitionMap && req.lastPartitionMap.partitions) || {},
                      function(res, partition, partitionId) {
                        res[partitionId] = {};
                        return res;
                      }, {});
    }
  }
};

function allocNumPartitions(req) {
  var res = {};
  for (var i = 0; i < req.wantPartitionParams.numPartitions; i++) {
    res[i.toString()] = {};
  }
  return res;
}
