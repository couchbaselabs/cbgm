// Only U/I related JS goes here.

function uiMap(ctx, page) {
  main(ctx, page, "uiMap");
  uiMapEventHandlers(ctx, page, page.r);
  uiMapRefresh(ctx, page);
}

function uiMapRefresh(ctx, page, ident) {
  var obj = findObjByNameOrIdent(ctx, "resourceEvents", ident || page.ident);
  renderObj(ctx, page.r, obj, {
    resourceEvents: _.sortBy(instances(ctx, "resourceEvents"), "name")
  });
}

function uiMapEventHandlers(ctx, page, r) {
  r.on({
    "refreshMaps": function(event) {
      refreshMaps(ctx);
      uiMapRefresh(ctx, page);
    }
  });
}
