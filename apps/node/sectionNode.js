// Only U/I related JS goes here.

function sectionNode(ctx, page) {
  page.nodeKnownArr = page.nodeKnownArr ||
    _.sortBy(instances(ctx, "nodeKnown"), "name").reverse();
  page.nodeKnownNames = _.pluck(page.nodeKnownArr, "name");
  page.nodeWantedArr = page.nodeWantedArr ||
    _.sortBy(instances(ctx, "nodeWanted"), "name").reverse();
  page.nodeWantedNames = _.pluck(page.nodeKnownArr, "name");
  page.obj =
    findObj(ctx, page.nodeKnownArr, "nodeKnown", page.ident) ||
    findObj(ctx, page.nodeWantedArr, "nodeWanted", page.ident);
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
            if (findObj(ctx, r.get("nodeKnownArr"), "nodeKnown", name)) {
              return alert("error: node (" + name + ") is already known.");
            }
            var nodeKnown = ctx.newObj("nodeKnown", { "name": name }).result;
            var nodeKnownArr = r.get("nodeKnownArr").push(nodeKnown);
            r.update("nodeKnownArr");
            renderObj(ctx, r, nodeKnown);
            event.node.value = "";
            event.node.focus();
          });
      }
    });
}
