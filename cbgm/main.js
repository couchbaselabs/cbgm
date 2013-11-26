function main(ctx, page) {
  page.sortDesc = sortDesc;
  page.want = page.want ||
    { keyFunc: "hash-crc32", assignment: "masterSlave", nodes: "a",
      numPartitions: 10, slaves: 1 };
  page.r = registerEventHandlers(ctx, page.render("main"));
}

function deepClone(x) {
  return JSON.parse(JSON.stringify(x));
}

function render(r, obj) {
  r.set("obj", obj);
  r.set("objJSON", JSON.stringify(obj));
}

function registerEventHandlers(ctx, r) {
  r.on({
    "rebalance": function(event) {
      var obj = r.get("obj");
      if (obj.class != "bucketEvents") {
        alert("error: obj is not a bucketEvents");
        return;
      }
      var want = r.get("want")
      var res = rebalance({
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
        render(r, res.nextBucketEvents);
      }
    }
  });
  return r;
}
