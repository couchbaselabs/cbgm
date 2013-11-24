function main(ctx, page) {
  page.r = registerEventHandlers(ctx, page.render("main"));
}

function deepClone(x) {
  return JSON.parse(JSON.stringify(x));
}

function registerEventHandlers(ctx, r) {
  r.on({
    "rebalance": function(event) {
      var obj = r.get("obj");
      if (obj.class != "bucketTour") {
        alert("obj is not a bucketTour");
        return;
      }
      var res = rebalance({ prevBucketTour: deepClone(obj) }) ||
        { err: "something wrong happened" };
      alert(res.err || "done");
    }
  });
  return r;
}
