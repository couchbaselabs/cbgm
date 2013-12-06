function sectionRebalance(ctx, page) {
  page.want = page.want ||
    { keyFunc: "hash-crc32",
      model: "masterSlave",
      nodes: "a",
      numPartitions: 10,
      constraints: 1,
      weights: "{}",
      hierarchy: "{}",
      hierarchyRules: "{}"
    };
  main(ctx, page, "sectionRebalance");
  sectionRebalanceEventHandlers(ctx, page.r);
}

var modelToConstraints = {
  masterSlave: "slave",
  multiMaster: "master"
}

function sectionRebalanceEventHandlers(ctx, r) {
  r.on({
    "rebalanceMap": function(event) {
      var obj = r.get("obj");
      if (obj.class != "resourceEvents") {
        obj = ctx.newObj("resourceEvents").result;
      }
      var want = r.get("want");
      var params = {
        keyFunc: want.keyFunc,
        model: want.model,
        nodes: want.nodes.split(','),
        numPartitions: parseInt(want.numPartitions),
        constraints: {},
        weights: JSON.parse(want.weights),
        hierarchy: JSON.parse(want.hierarchy),
        hierarchyRules: JSON.parse(want.hierarchyRules)
      };
      params.constraints[modelToConstraints[params.model]] =
        parseInt(want.constraints);
      var res = rebalanceMap(ctx, {
        prevResourceEvents: deepClone(obj),
        wantPartitionParams: ctx.newObj("partitionParams", params).result }) ||
        { err: "unexpected rebalance error" };
      console.log(res);
      if (res.err) {
        return alert("error: " + res.err);
      }
      if (res.nextResourceEvents) {
        refresh(r, res.nextResourceEvents, res.warnings);
      }
    },
    "scheduleMoves": function(event) {
      var resourceEvents = r.get("obj");
      if (resourceEvents.class != "resourceEvents") {
        return alert("error: obj is not a resourceEvents");
      }
      var partitionMapEndIdx;
      var partitionMapEnd = _.find(resourceEvents.events, function(be, idx) {
          partitionMapEndIdx = idx;
          return be.class == "partitionMap" && be.when == event.node.id;
        });
      var partitionMapBeg = _.find(resourceEvents.events, function(be, idx) {
          return be.class == "partitionMap" && idx > partitionMapEndIdx;
        });
      var res = scheduleMoves(ctx, {
        wantPartitionParams: partitionMapEnd,
        partitionMapBeg: partitionMapBeg,
        partitionMapEnd: partitionMapEnd
      });
      console.log(res);
      if (res.err) {
        return alert("error: " + res.err);
      }
      r.set({ schedule: JSON.stringify(res.schedule), warnings: res.warnings });
    },
  });
  return r;
}
