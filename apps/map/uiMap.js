// Only U/I related JS goes here.

function uiMap(ctx, page) {
  main(ctx, page, "uiMap");
  uiMapEventHandlers(ctx, page, page.r);
  uiMapRefresh(ctx, page);
}

function uiMapRefresh(ctx, page, ident) {
  var obj = findObjByNameOrIdent(ctx, "map", ident || page.ident);
  renderObj(ctx, page.r, obj, {
    mapArr: _.sortBy(instances(ctx, "map"), "name")
  });
}

function uiMapEventHandlers(ctx, page, r) {
  r.on({
    "refreshMaps": function(event) {
      uiMapRefresh(ctx, page);
    }
  });
}
