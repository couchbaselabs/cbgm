// Only U/I related JS goes here.

var hierarchyRuleMap = {
  "none": {},
  "same container": { includeLevel: 1, excludeLevel: 0 },
  "different container": { includeLevel: 2, excludeLevel: 1 },
};
var hierarchyRuleNames = ["none", "same container", "different container" ];

function uiBucket(ctx, page) {
  page.hierarchyRuleNames = hierarchyRuleNames;
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
      var names = _.compact($("#bucket_name").val().split(","));
      var errs = _.compact(_.map(names, function(name) {
          if (!name) {
            return "error: bucket name is missing";
          }
          var path = pool + "_" + name;
          if (findObjByNameOrIdent(ctx, "bucket", path, "path")) {
            return "error: bucket (" + path + ") is already known";
          }
        }));
      if (!_.isEmpty(errs)) {
        return alert(errs.join("\n"));
      }
      var ident;
      _.each(names, function(name) {
          var path = pool + "_" + name;
          ident = "bucket-" + path;
          ctx.setObj(ident, ctx.newObj("bucket", {
            path: path,
            numPartitions: parseInt($("#bucket_numPartitions").val() || "10"),
            perNodeMemory: parseInt($("#bucket_perNodeMemory").val() || "100"),
            numSlaves: parseInt($("#bucket_numSlaves").val() || "0"),
            slaveHierarchyRules:
              [hierarchyRuleMap[$("#bucket_slaveHierarchyRules").val() || "none"]]
          }).result);
        });
      $(".newBucket input").val("");
      $("#bucket_name").val("");
      uiBucketRefresh(ctx, page, ident);
    }
  });
}
