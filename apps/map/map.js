var g_everyEligible = ["kvStore",
                       "backIndexStore",
                       "viewStore",
                       "indexStore",
                       "fullTextStore"];

var g_services = ["governor",
                  "janitor",
                  "stats",
                  "log",
                  "healthCheck",
                  "n1ql",
                  "proxy",
                  "autoFailOver",
                  "xdcr",
                  "backup"];

var maps = ["for each bucket",
            "for each index"];

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
          hierarchyRules: {}
          };
          var nodesToUse = _.filter(nodesWanted, function(node) {
              return _.isEmpty(node.usage) || _.contains(node.usage, className);
            });
          refreshMap(ctx, want, nodesToUse, className + "_" + instance.path,
                     errs, warnings);
        });
    });

  return { errs: errs, warnings: warnings };
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
  var params = {
    keyFunc: want.keyFunc,
    model: want.model,
    nodes: nodeNames,
    numPartitions: want.numPartitions,
    constraints: want.constraints,
    nodeWeights: nodeWeights,
    partitionWeights: {},
    hierarchy: {},
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
