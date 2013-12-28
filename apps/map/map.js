function refreshMaps(ctx) {
  var errs = [];
  var warnings = [];
  var nodesWanted = instances(ctx, "nodeWanted");

  _.each(["bucket", "index"], function(className) {
      _.each(instances(ctx, className), function(instance) {
          var want = {
            keyFunc: "hash-crc32",
            model: "masterSlave",
            numPartitions: instance.numPartitions || 1024,
            constraints: { slave: instance.numSlaves || 0 },
            partitionWeights: {},
            hierarchyRules: { slave: instance.slaveHierarchyRules }
          };
          var nodesToUse = filterNodesByUsage(nodesWanted, className);
          refreshMap(ctx, want, nodesToUse, className + "_" + instance.path,
                     errs, warnings);
        });
    });

  return { errs: errs, warnings: warnings };
}

function filterNodesByUsage(nodes, usage) {
  var notUsage = "-" + usage;
  return _.filter(nodes, function(node) {
      var notDisallowed = _.every(node.usage, function(u) {
          return u[0] == '-' && u != notUsage;
        });
      return notDisallowed || _.contains(node.usage, usage);
    });
}

function refreshMap(ctx, want, nodesToUse, name, errs, warnings) {
  var resourceEventsIdent = "resourceEvent-" + name;
  var prevResourceEvents = ctx.getObj(resourceEventsIdent).result;
  if (!prevResourceEvents) {
    prevResourceEvents = ctx.newObj("resourceEvents").result;
  }
  var nodeNames = _.pluck(nodesToUse, "name");
  var nodeWeights = _.reduce(nodesToUse, function(w, node) {
      if (node.weight) {
        w[node.name] = node.weight;
      }
      return w;
    }, {});
  var mapContainerParent = {};
  var mapContainerChildren = {};
  nodeHierarchy(ctx, "nodeWanted", nodeNames,
                mapContainerParent, mapContainerChildren);
  var params = {
    keyFunc: want.keyFunc,
    model: want.model,
    nodes: nodeNames,
    numPartitions: want.numPartitions,
    constraints: want.constraints,
    nodeWeights: nodeWeights,
    partitionWeights: want.partitionWeights,
    hierarchy: mapContainerParent,
    hierarchyRules: want.hierarchyRules
  };
  var res = rebalanceMap(ctx, {
    prevResourceEvents: deepClone(prevResourceEvents),
    wantPartitionParams: ctx.newObj("partitionParams", params).result }) ||
    { err: "unexpected rebalance error" };
  console.log(res);
  if (!res.err && res.nextResourceEvents) {
    res.nextResourceEvents.name = name;
    ctx.setObj(resourceEventsIdent, res.nextResourceEvents);
  }
  if (errs != null && res.err) {
    errs.push(res.err);
  }
  if (warnings != null && res.warnings) {
    warnings.push(res.warnings);
  }
  return res;
}
