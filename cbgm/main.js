function main(ctx, page) {
  page.sortDesc = function(a, field) { return _.sortBy(a, field).reverse(); }
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
      var res = rebalance({ prevBucketEvents: deepClone(obj) }) ||
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
