var resourceKeyFunc = {
  "identity": {
    allocPartitions: clonePartitions
  },
  "hash-crc32": {
    allocPartitions: allocNumPartitions
  },
  "range": {
    allocPartitions: clonePartitions
  }
};

function clonePartitions(req) {
  return _.reduce((req.lastPartitionMap && req.lastPartitionMap.partitions) ||
                  (req.initPartitionsFunc && req.initPartitionsFunc(req)) || {},
                  function(res, partition, partitionId) {
                    res[partitionId] = {};
                    return res;
                  }, {});
}

function allocNumPartitions(req) {
  var res = {};
  for (var i = 0; i < req.wantPartitionParams.numPartitions; i++) {
    res[i.toString()] = {};
  }
  return res;
}
