function main(ctx, page) {
  page.sortDesc = function(a, field) { return _.sortBy(a, field).slice(0).reverse(); }
  page.r = registerEventHandlers(ctx, page.render("main"));
}

function deepClone(x) {
  return JSON.parse(JSON.stringify(x));
}

function registerEventHandlers(ctx, r) {
  r.on({
    "rebalance": function(event) {
      var obj = r.get("obj");
      if (obj.class != "bucketEvents") {
        alert("obj is not a bucketEvents");
        return;
      }
      var res = rebalance({ prevBucketEvents: deepClone(obj) }) ||
        { err: "unexpected rebalance error" };
      console.log(res)
      alert(res.err || "done");
    }
  });
  return r;
}
