// Only U/I related JS goes here.

function uiIndex(ctx, page) {
  main(ctx, page, "uiIndex");
  uiIndexEventHandlers(ctx, page, page.r);
  uiIndexRefresh(ctx, page);
}

function uiIndexRefresh(ctx, page, ident) {
  var obj = findObjByNameOrIdent(ctx, "index", ident || page.ident, "path");
  var buckets = _.sortBy(instances(ctx, "bucket"), "path");

  renderObj(ctx, page.r, obj, {
    indexes: _.sortBy(instances(ctx, "index"), "path"),
    bucketPaths: _.pluck(buckets, "path")
  });
}

function uiIndexEventHandlers(ctx, page, r) {
  r.on({
    "newIndex": function(event) {
      var bucket = $("#index_bucket").val();
      if (!bucket) {
        return alert("error: please choose a bucket for the index");
      }
      var names = $("#index_name").val();
      var ident;
      _.each(names.split(","), function(name) {
          if (!name) {
            return alert("error: index name is missing");
          }
          var path = bucket + "_" + name;
          if (findObjByNameOrIdent(ctx, "index", path, "path")) {
            return alert("error: index (" + path + ") is already known.");
          }
        ident = "index-" + path;
        ctx.setObj(ident, ctx.newObj("index", {
          path: path,
          numPartitions: parseInt($("#index_numPartitions").val() || "10"),
          numSlaves: parseInt($("#index_numSlaves").val() || "0"),
          perNodeMemory: parseInt($("#index_perNodeMemory").val() || "100")
        }).result);
      });
      $("#index_name").val("");
      uiIndexRefresh(ctx, page, ident);
    }
  });
}
