// Only U/I related JS goes here.

function sectionPool(ctx, page) {
  main(ctx, page, "sectionPool");
  sectionPoolEventHandlers(ctx, page, page.r);
  sectionPoolRefresh(ctx, page);
}

function sectionPoolRefresh(ctx, page, ident) {
  var obj = findObjByNameOrIdent(ctx, "pool", ident || page.ident);
  renderObj(ctx, page.r, obj, {
    pools: _.sortBy(instances(ctx, "pool"), "name")
  });
}

function sectionPoolEventHandlers(ctx, page, r) {
  r.on({
    "newPool": newNamedObjEventHandler(ctx, page,
                                       "pool", sectionPoolRefresh)
  });
}
