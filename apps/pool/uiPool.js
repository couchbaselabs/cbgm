// Only U/I related JS goes here.

function uiPool(ctx, page) {
  main(ctx, page, "uiPool");
  uiPoolEventHandlers(ctx, page, page.r);
  uiPoolRefresh(ctx, page);
}

function uiPoolRefresh(ctx, page, ident) {
  var obj = findObjByNameOrIdent(ctx, "pool", ident || page.ident);
  renderObj(ctx, page.r, obj, {
    pools: _.sortBy(instances(ctx, "pool"), "name")
  });
}

function uiPoolEventHandlers(ctx, page, r) {
  r.on({
    "newPool": newNamedObjEventHandler(ctx, page, "pool", uiPoolRefresh)
  });
}
