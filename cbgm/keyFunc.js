keyFunc = {
  "hash-crc32": {
    allocPartitions: function(partitionParams) {
      var res = {};
      for (var i = 0; i < partitionParams.numPartitions; i++) {
        res[i.toString()] = {};
      }
      return res;
    }
  }
}
