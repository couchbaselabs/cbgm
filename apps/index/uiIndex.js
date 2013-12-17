// Only U/I related JS goes here.

function uiIndex(ctx, page) {
  page.hierarchyRuleNames = hierarchyRuleNames;
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
      var target = $("#index_target").val();
      if (!target) {
        return alert("error: index target is missing");
      }
      var names = _.compact($("#index_name").val().split(","));
      var errs = _.compact(_.map(names, function(name) {
          if (!name) {
            return "error: index name is missing";
          }
          var path = bucket + "_" + name;
          if (findObjByNameOrIdent(ctx, "index", path, "path")) {
            return "error: index (" + path + ") is already known";
          }
        }));
      if (!_.isEmpty(errs)) {
        return alert(errs.join("\n"));
      }
      var ident;
      _.each(names, function(name) {
          var path = bucket + "_" + name;
          ident = "index-" + path;
          ctx.setObj(ident, ctx.newObj("index", {
            path: path,
            target: target,
            numPartitions: parseInt($("#index_numPartitions").val() || "10"),
            perNodeMemory: parseInt($("#index_perNodeMemory").val() || "100"),
            numSlaves: parseInt($("#index_numSlaves").val() || "0"),
            slaveHierarchyRules:
              [hierarchyRuleMap[$("#index_slaveHierarchyRules").val() || "none"]]
          }).result);
        });
      $(".newIndex input").val("");
      $("#index_name").val("");
      uiIndexRefresh(ctx, page, ident);
    }
  });
}
