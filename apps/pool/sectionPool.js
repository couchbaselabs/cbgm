// Only U/I related JS goes here.

function sectionPool(ctx, page) {
  main(ctx, page, "sectionPool");
  sectionPoolEventHandlers(ctx, page, page.r);
  sectionPoolRefresh(ctx, page);
}

function sectionPoolRefresh(ctx, page, ident) {
  renderObj(ctx, page.r);
}

function sectionPoolEventHandlers(ctx, page, r) {
}
