// Only U/I related JS goes here.

function sectionNode(ctx, page) {
  page.nodeCfgs = page.nodeCfgs ||
    _.sortBy(ctx.filterObjs(function(o) { return o.class == "nodeCfg"; }).result,
             "name");
  page.obj = findObj(ctx, page.nodeCfgs, "nodeCfg", page.ident);
  main(ctx, page, "sectionNode");
  sectionNodeEventHandlers(ctx, page.r);
}

function sectionNodeEventHandlers(ctx, r) {
  r.on({
      "newNodeCfg": function(event) {
        var names = (event.node.value || "").trim();
        if (!names) {
          return;
        }
        _.each(names.split(","), function(name) {
            var nodeCfg = ctx.newObj("nodeCfg", { "name": name }).result;
            var nodeCfgs = r.get("nodeCfgs").unshift(nodeCfg);
            r.update("nodeCfgs");
            renderObj(ctx, r, nodeCfg);
            event.node.value = "";
            event.node.focus();
          });
      }
    });
}
