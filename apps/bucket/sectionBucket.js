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
    "newBucket": newNamedObjEventHandler(ctx, page, "bucket", sectionBucketRefresh,
                                         [ ["path", getNewBucketPath, "pool"] ])
  });

  function getNewBucketPath(pool) {
    return pool + "/" + $("#bucket_name").val();
  }
}
