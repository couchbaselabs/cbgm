function main(ctx, page) {
  page.sortDesc = sortDesc;
  page.isClass = function(o, cn) { return o.class == cn; }
  page.field = function(o, f) { return o[f]; }
  page.want = page.want ||
    { keyFunc: "hash-crc32", assignment: "masterSlave", nodes: "a",
      numPartitions: 10, slaves: 1 };
  sortEvents(page.obj);
  page.r = registerEventHandlers(ctx, page.render("main"));
  refresh(page.r, page.obj);
}

function registerEventHandlers(ctx, r) {
  r.on({
    "rebalance": function(event) {
      var obj = r.get("obj");
      if (obj.class != "bucketEvents") {
        alert("error: obj is not a bucketEvents");
        return;
      }
      var want = r.get("want");
      var res = rebalance(ctx, {
        prevBucketEvents: deepClone(obj),
        wantPartitionParams: ctx.newObj("partitionParams",
                                        { keyFunc: want.keyFunc,
                                            assignment: want.assignment,
                                            nodes: want.nodes.split(','),
                                            numPartitions: parseInt(want.numPartitions),
                                            constraints: { slaves: parseInt(want.slaves) }
                                        }).result }) ||
        { err: "unexpected rebalance error" };
      console.log(res);
      if (res.err) {
        alert("error: " + res.err);
        return;
      }
      alert("done");
      if (res.nextBucketEvents) {
        refresh(r, res.nextBucketEvents);
      }
    }
  });
  return r;
}

function sortEvents(obj) {
  if (obj.events) {
    obj.events = sortDesc(obj.events, "when");
  }
}

function refresh(r, obj) {
  sortEvents(obj);
  r.set({ obj: obj, objJSON: JSON.stringify(obj) });
}

function deepClone(x) {
  return JSON.parse(JSON.stringify(x));
}
