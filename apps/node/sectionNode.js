// Only U/I related JS goes here.

function sectionNode(ctx, page) {
  main(ctx, page, "sectionNode");
  sectionNodeEventHandlers(ctx, page, page.r);
  sectionNodeRefresh(ctx, page);
}

function sectionNodeRefresh(ctx, page, ident) {
  var nodeKnownArr = _.sortBy(instances(ctx, "nodeKnown"), "name");
  var nodeKnownNames = _.pluck(page.nodeKnownArr, "name");
  var nodeWantedArr = _.sortBy(instances(ctx, "nodeWanted"), "name");
  var nodeWantedNames = _.pluck(page.nodeKnownArr, "name");
  var obj =
    findObjByNameOrIdent(ctx, "nodeKnown", ident || page.ident) ||
    findObjByNameOrIdent(ctx, "nodeWanted", ident || page.ident);
  renderObj(ctx, page.r, obj, {
    nodeKnownArr: nodeKnownArr,
    nodeKnownNames: nodeKnownNames,
    nodeWantedArr: nodeWantedArr,
    nodeWantedNames: nodeWantedNames
  });
}

function sectionNodeEventHandlers(ctx, page, r) {
  r.on({
      "newNodeKnown": function(event) {
        var names = (event.node.value || "").trim();
        if (!names) {
          return;
        }
        var ident;
        _.each(names.split(","), function(name) {
            if (findObjByNameOrIdent(ctx, "nodeKnown", name)) {
              return alert("error: node (" + name + ") is already known.");
            }
            ident = "nodeKnown-" + name;
            ctx.setObj(ident, ctx.newObj("nodeKnown", { "name": name }).result);
          });
        event.node.value = "";
        event.node.focus();
        sectionNodeRefresh(ctx, page, ident);
      }
    });
}
