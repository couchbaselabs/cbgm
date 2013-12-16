// Only U/I related JS goes here.

function uiBucket(ctx, page) {
  main(ctx, page, "uiBucket");
  uiBucketEventHandlers(ctx, page, page.r);
  uiBucketRefresh(ctx, page);
}

function uiBucketRefresh(ctx, page, ident) {
  var obj = findObjByNameOrIdent(ctx, "bucket", ident || page.ident, "path");
  var pools = _.sortBy(instances(ctx, "pool"), "name");

  renderObj(ctx, page.r, obj, {
    buckets: _.sortBy(instances(ctx, "bucket"), "path"),
    poolNames: _.pluck(pools, "name")
  });
}

function uiBucketEventHandlers(ctx, page, r) {
  r.on({
    "newBucket": function(event) {
      var pool = $("#bucket_pool").val();
      if (!pool) {
        return alert("error: please choose a pool for the bucket");
      }
      var names = $("#bucket_name").val();
      var ident;
      _.each(names.split(","), function(name) {
          if (!name) {
            return alert("error: bucket name is missing");
          }
          var path = pool + "_" + name;
          if (findObjByNameOrIdent(ctx, "bucket", path, "path")) {
            return alert("error: bucket (" + path + ") is already known.");
          }
        ident = "bucket-" + path;
        ctx.setObj(ident, ctx.newObj("bucket", {
          path: path,
          numPartitions: parseInt($("#bucket_numPartitions").val() || "10"),
          numSlaves: parseInt($("#bucket_numSlaves").val() || "0"),
          perNodeMemory: parseInt($("#bucket_perNodeMemory").val() || "100")
        }).result);
      });
      $("#bucket_name").val("");
      uiBucketRefresh(ctx, page, ident);
    }
  });
}
