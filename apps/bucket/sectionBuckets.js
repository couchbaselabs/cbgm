// Only U/I related JS goes here.

function sectionBuckets(ctx, page) {
  page.bucketCfgs =
    _.sortBy(ctx.filterObjs(function(o) { return o.class == "bucketCfg"; }).result,
             "name");

  main(ctx, page, "sectionBuckets");
  sectionBucketsEventHandlers(ctx, page.r);
}

function sectionBucketsEventHandlers(ctx, r) {
  return r;
}
