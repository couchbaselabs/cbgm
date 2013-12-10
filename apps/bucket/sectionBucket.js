// Only U/I related JS goes here.

function sectionBucket(ctx, page) {
  page.bucketCfgs =
    _.sortBy(ctx.filterObjs(function(o) { return o.class == "bucketCfg"; }).result,
             "name");
  main(ctx, page, "sectionBucket");
}
