// Only U/I related JS goes here.

function uiPartition(ctx, page) {
  page.want = page.want ||
    { keyFunc: "hash-crc32",
      model: "masterSlave",
      nodes: "a",
      numPartitions: 10,
      constraints: 1,
      nodeWeights: "{}",
      partitionWeights: "{}",
      hierarchy: "{}",
      hierarchyRules: "{}"
    };
  sortEvents(page.obj);
  page.visualResourceEvent = visualResourceEvent;
  main(ctx, page, "uiPartition");
  uiPartitionEventHandlers(ctx, page.r);
}

var modelToConstraints = {
  masterSlave: "slave",
  multiMaster: "master"
}

function uiPartitionEventHandlers(ctx, r) {
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
        nodeWeights: JSON.parse(want.nodeWeights),
        partitionWeights: JSON.parse(want.partitionWeights),
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
        refreshResourceEvents(r, res.nextResourceEvents, res.warnings);
      }
    },
    "scheduleMoves": scheduleMovesEventHandler(ctx, r)
  });
  return r;
}

function refreshResourceEvents(r, obj, warnings) {
  sortEvents(obj);
  r.set({ obj: obj, objJSON: JSON.stringify(obj), warnings: warnings });
}

function sortEvents(obj) {
  if (obj.events) {
    obj.events = sortDesc(obj.events, "when");
  }
}

function deepClone(x) {
  return JSON.parse(JSON.stringify(x));
}

function scheduleMovesEventHandler(ctx, r) {
  return function(event) {
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
    console.log(partitionMapBeg, partitionMapEnd, res);
    if (res.err) {
      return alert("error: " + res.err);
    }
    r.set({ schedule: JSON.stringify(res.schedule), warnings: res.warnings });
  };
}
