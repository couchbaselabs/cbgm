// Only U/I related JS goes here.

function sectionNodes(ctx, page) {
  page.nodeCfgs = page.nodeCfgs ||
    _.sortBy(ctx.filterObjs(function(o) { return o.class == "nodeCfg"; }).result,
             "name");
  page.obj = findNodeCfg(ctx, page.nodeCfgs, page.ident);
  main(ctx, page, "sectionNodes");
  sectionNodesEventHandlers(ctx, page.r);
}

function sectionNodesEventHandlers(ctx, r) {
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
            renderNodeCfg(ctx, r, nodeCfg);
            event.node.value = "";
            event.node.focus();
          });
      }
    });
}

function renderNodeCfg(ctx, r, nodeCfg, extras) {
  r.set(_.defaults(extras || {}, {
        "obj": nodeCfg,
        "objEdit": _.clone(nodeCfg),
        "objEditErrs": null,
        "doEdit": false
      }));
  r.set("objJSON", JSON.stringify(nodeCfg));
}

function findNodeCfg(ctx, nodeCfgs, nameOrIdent) {
  var name = (nameOrIdent || "").split("-")[1] || nameOrIdent;
  return _.find(nodeCfgs, where) || ctx.findObj(where).result;
  function where(n) { return n.class == "nodeCfg" && n.name == name; };
}

