function sectionNodes(ctx, page) {
  page.nodeCfgs =
    _.sortBy(ctx.filterObjs(function(o) { return o.class == "nodeCfg"; }).result,
             "name");
  main(ctx, page, "sectionNodes");
  sectionNodesEventHandlers(ctx, page.r);
}

function sectionNodesEventHandlers(ctx, r) {
  return r;
}
