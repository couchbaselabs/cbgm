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
    "newPool": function(event) {
      var names = (event.node.value || "").trim();
      var ident;
      _.each(names.split(","), function(name) {
          if (!name) {
            return alert("error: pool name is missing");
          }
          if (findObjByNameOrIdent(ctx, "pool", name)) {
            return alert("error: pool (" + name + ") is already known.");
          }
          ident = "pool-" + name;
          ctx.setObj(ident, ctx.newObj("pool", { "name": name }).result);
        });
      event.node.value = "";
      event.node.focus();
      sectionPoolRefresh(ctx, page, ident);
    }
  });
}
