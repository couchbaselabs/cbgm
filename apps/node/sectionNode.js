// Only U/I related JS goes here.

function sectionNode(ctx, page) {
  main(ctx, page, "sectionNode");
  sectionNodeEventHandlers(ctx, page, page.r);
  sectionNodeRefresh(ctx, page);
}

function sectionNodeRefresh(ctx, page, ident) {
  var obj =
    findObjByNameOrIdent(ctx, "nodeWanted", ident || page.ident) ||
    findObjByNameOrIdent(ctx, "nodeKnown", ident || page.ident);

  var nodeKnownArr = _.sortBy(instances(ctx, "nodeKnown"), "name");
  var nodeKnownNames = _.pluck(nodeKnownArr, "name");

  var nodeWantedArr = _.sortBy(instances(ctx, "nodeWanted"), "name");
  var nodeWantedNames = _.pluck(nodeWantedArr, "name");

  renderObj(ctx, page.r, obj, {
    nodeKnownArr: nodeKnownArr,
    nodeKnownNames: nodeKnownNames,
    nodeWantedArr: nodeWantedArr,
    nodeWantedNames: nodeWantedNames,
    nodeUnwantedNames: _.difference(nodeKnownNames, nodeWantedNames)
  });

  $("input.node").attr("checked", false);
}

function sectionNodeEventHandlers(ctx, page, r) {
  r.on({
    "newNodeKnown":
      newNamedObjEventHandler(ctx, page, "nodeKnown",
                              sectionNodeRefresh,
                              [ ["container", String],
                                ["usage", function(s) { return s.split(','); }],
                                ["weight", parseFloat] ]),
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
