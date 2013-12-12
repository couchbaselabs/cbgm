// Only U/I related JS goes here.

function sectionNode(ctx, page) {
  main(ctx, page, "sectionNode");
  sectionNodeEventHandlers(ctx, page, page.r);
  sectionNodeRefresh(ctx, page);
}

function sectionNodeRefresh(ctx, page, ident) {
  var nodeKnownArr = _.sortBy(instances(ctx, "nodeKnown"), "name");
  var nodeKnownMap = _.indexBy(nodeKnownArr, "name");
  var nodeKnownNames = _.pluck(nodeKnownArr, "name");

  var nodeWantedArr = _.sortBy(instances(ctx, "nodeWanted"), "name");
  var nodeWantedMap = _.indexBy(nodeWantedArr, "name");
  var nodeWantedNames = _.pluck(nodeWantedArr, "name");

  var obj =
    findObjByNameOrIdent(ctx, "nodeWanted", ident || page.ident) ||
    findObjByNameOrIdent(ctx, "nodeKnown", ident || page.ident);

  renderObj(ctx, page.r, obj, {
    nodeKnownArr: nodeKnownArr,
    nodeKnownMap: nodeKnownMap,
    nodeKnownNames: nodeKnownNames,
    nodeWantedArr: nodeWantedArr,
    nodeWantedMap: nodeWantedMap,
    nodeWantedNames: nodeWantedNames,
    nodeUnwantedNames: _.difference(nodeKnownNames, nodeWantedNames)
  });

  $("input.node").attr("checked", false);
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
            if (!name) {
              return alert("error: node name is missing");
            }
            if (findObjByNameOrIdent(ctx, "nodeKnown", name)) {
              return alert("error: node (" + name + ") is already known.");
            }
            ident = "nodeKnown-" + name;
            ctx.setObj(ident, ctx.newObj("nodeKnown", { "name": name }).result);
          });
        event.node.value = "";
        event.node.focus();
        sectionNodeRefresh(ctx, page, ident);
      },
     "addNodes": function(event) {
       _.each(_.pluck(_.where($("input.nodeKnown"), { "checked": true }), "id"),
              function(ident) {
                var nk = ctx.getObj(ident).result;
                if (!nk || nk.class != "nodeKnown") {
                  return alert("error: not a nodeKnown, ident: " + ident);
                }
                var nw = ctx.getObj("nodeWanted-" + nk.name).result;
                if (nw) {
                  return alert("error: already a nodeWanted, ident: " + ident);
                }
                nw = ctx.newObj("nodeWanted",
                                _.omit(nk, "class", "createdAt", "updatedAt")).result;
                ctx.setObj("nodeWanted-" + nw.name, nw);
              });
       sectionNodeRefresh(ctx, page);
     },
     "removeNodes": function(event) {
       _.each(_.pluck(_.where($("input.nodeWanted"), { "checked": true }), "id"),
              function(ident) {
                var nw = ctx.getObj(ident).result;
                if (!nw || nw.class != "nodeWanted") {
                  return alert("error: not a nodeWanted, ident: " + ident);
                }
                ctx.delObj(ident);
              });
       sectionNodeRefresh(ctx, page);
     }
  });
}
