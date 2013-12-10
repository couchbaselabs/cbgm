// Only U/I related JS goes here.

function sectionNode(ctx, page) {
  page.nodesKnown = page.nodesKnown ||
    _.sortBy(ctx.filterObjs(function(o) { return o.class == "nodeKnown"; }).result,
             "name");
  page.nodesWanted = page.nodesWanted ||
    _.sortBy(ctx.filterObjs(function(o) { return o.class == "nodeWanted"; }).result,
             "name");
  page.obj = findObj(ctx, page.nodesKnown, "nodeKnown", page.ident);
  main(ctx, page, "sectionNode");
  sectionNodeEventHandlers(ctx, page.r);
}

function sectionNodeEventHandlers(ctx, r) {
  r.on({
      "newNodeKnown": function(event) {
        var names = (event.node.value || "").trim();
        if (!names) {
          return;
        }
        _.each(names.split(","), function(name) {
            var nodeKnown = ctx.newObj("nodeKnown", { "name": name }).result;
            var nodesKnown = r.get("nodesKnown").unshift(nodeKnown);
            r.update("nodesKnown");
            renderObj(ctx, r, nodeKnown);
            event.node.value = "";
            event.node.focus();
          });
      }
    });
}
