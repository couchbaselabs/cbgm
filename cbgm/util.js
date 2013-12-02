function initPartitionModel(ctx, req) {
  req.warnings = [];
  req.partitionModel =
    ctx.getObj("partitionModel-" + req.wantPartitionParams.model).result;
  if (!req.partitionModel) {
    req.err = "error: missing partitionModel-" + req.wantPartitionParams.model;
    return;
  }
  req.mapStatePriority = {}; // Key is state name ("master"), val is priority int.
  req.partitionModelStates =
    sortDesc(_.reduce(req.partitionModel.states, function(a, s, stateName) {
          req.mapStatePriority[stateName] = s.priority;
          a.push(_.defaults(_.clone(s), { name: stateName }));
          return a;
        }, []),
      "priority");
}

// Returns partition with nodes removed.  Example, when removeNodes == ["a"],
//   input  - partition: {"0": { "master": ["a"], "slave": ["b"] } }
//   return - partition: {"0": { "master": [], "slave": ["b"] } }
function removeNodesFromPartition(partition, removeNodes, cb) {
  return _.object(_.map(partition, function(partitionNodes, state) {
        if (cb) {
          cb(state, _.intersection(partitionNodes, removeNodes));
        }
        return [state, _.difference(partitionNodes, removeNodes)];
      }));
}

// Converts node indexes to node names.  Example, with "nodes": ["a", "b"]:
//   input  - "partitions": { "0": { "master": [0], "slave": [1] }, ... }
//   return - "partitions": { "0": { "master": ["a"], "slave": ["b"] }, ... }
// Reverse of partitionsWithNodeIndexes().
function partitionsWithNodeNames(partitions, nodes) {
  return partitionsMap(partitions,
                       function(nodeIdx) { return nodes[nodeIdx]; });
}

// Converts node names to indexes.  Example, with node" == ["a", "b"]:
//   input  - partitions: { "0": { "master": ["a"], "slave": ["b"] }, ... }
//   return - partitions: { "0": { "master": [0], "slave": [1] }, ... }
// Reverse of partitionsWithNodeNames().
function partitionsWithNodeIndexes(partitions, nodes) {
  return partitionsMap(partitions,
                       function(nodeName) { return _.indexOf(nodes, nodeName); });
}

// Like map(), but runs f() on every nodes array in the partition.
// Example, with partitions == { "0": { "master": ["a"], "slave": ["b", "c"] } }
// then you'll see f(["a"]) and f(["b", "c"]).
function partitionsMap(partitions, f) {
  return _.object(_.map(partitions, function(partition, partitionId) {
        return [partitionId,
                _.object(_.map(partition, function(arr, state) {
                      return [state, _.map(arr, f)];
                    }))];
      }));
}

function run(ctx, req) { // Varargs are steps to apply to req as long as no req.err.
  return _.reduce(_.rest(arguments, 2), function(req, step) {
      return req.err ? req : step(ctx, req) || req;
    }, req);
}

function sortDesc(a, field) { return _.sortBy(a, field).reverse(); }
