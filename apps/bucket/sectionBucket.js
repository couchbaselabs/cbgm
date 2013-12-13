// Only U/I related JS goes here.

function sectionBucket(ctx, page) {
  main(ctx, page, "sectionBucket");
  sectionBucketEventHandlers(ctx, page, page.r);
  sectionBucketRefresh(ctx, page);
}

function sectionBucketRefresh(ctx, page, ident) {
  var obj = findObjByNameOrIdent(ctx, "bucket", ident || page.ident, "path");

  var pools = _.sortBy(instances(ctx, "pool"), "name");
  var poolNames = _.pluck(pools, "name");

  renderObj(ctx, page.r, obj, {
    buckets: _.sortBy(instances(ctx, "bucket"), "path"),
    poolNames: poolNames
  });
}

function sectionBucketEventHandlers(ctx, page, r) {
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
        ctx.setObj(ident, ctx.newObj("bucket", { path: path }).result);
      });
      $("#bucket_name").val("");
      sectionBucketRefresh(ctx, page, ident);
    }
  });
}
