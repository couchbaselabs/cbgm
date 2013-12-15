// Only U/I related JS goes here.

function uiNode(ctx, page) {
  main(ctx, page, "uiNode");
  uiNodeEventHandlers(ctx, page, page.r);
  uiNodeRefresh(ctx, page);
}

function uiNodeRefresh(ctx, page, ident) {
  var obj =
    findObjByNameOrIdent(ctx, "nodeWanted", ident || page.ident) ||
    findObjByNameOrIdent(ctx, "nodeKnown", ident || page.ident) ||
    page.obj;

  var nodeKnownArr = _.sortBy(instances(ctx, "nodeKnown"), "name");
  var nodeKnownNames = _.pluck(nodeKnownArr, "name");

  var nodeWantedArr = _.sortBy(instances(ctx, "nodeWanted"), "name");
  var nodeWantedNames = _.pluck(nodeWantedArr, "name");

  renderObj(ctx, page.r, obj, {
    nodeKnownArr: nodeKnownArr,
    nodeKnownNames: nodeKnownNames,
    nodeWantedArr: nodeWantedArr,
    nodeWantedNames: nodeWantedNames,
    nodeUnwantedNames: _.difference(nodeKnownNames, nodeWantedNames),
    uiNodeHierarchy: uiNodeHierarchy
  });

  $("input.node").attr("checked", false);
}

function uiNodeEventHandlers(ctx, page, r) {
  r.on({
    "newNodeKnown":
      newNamedObjEventHandler(ctx, page, "nodeKnown", uiNodeRefresh,
                              [ ["container", String],
                                ["usage", function(s) {
                                    return _.compact(s.split(','));
                                  }],
                                ["weight", parseFloat, "1" ] ]),
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
      uiNodeRefresh(ctx, page);
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
      uiNodeRefresh(ctx, page);
    }
  });
}

function uiNodeHierarchy(ctx, className, nodeNames, obj) {
  var mapContainerChildren = {};
  _.each(nodeNames, function(nodeName) {
      var node = ctx.getObj(className + "-" + nodeName).result;
      var parent = "/";
      if (node.container) {
        _.each(node.container.split("/"), function(x) {
            mapContainerChildren[parent] = mapContainerChildren[parent] || {};
            mapContainerChildren[parent][parent + x + "/"] = "nodeContainer";
            parent = parent + x + "/";
          });
      }
      mapContainerChildren[parent] = mapContainerChildren[parent] || {};
      mapContainerChildren[parent][node.name] = node.class;
    });

  var res = [];
  function gen(container) {
    var path = container.split("/");
    res.push(path[path.length - 2]);
    res.push("<ul>");
    _.each(mapContainerChildren[container], function(childKind, child) {
        var classAttr = "";
        if (obj && obj.class == childKind && obj.name == child) {
          classAttr = ' current';
        }
        res.push('<li class="' + childKind + classAttr + '">');
        if (childKind == "nodeContainer") {
          gen(child);
        } else {
          res.push('<input type="checkbox" class="node ' + childKind + '"' +
                   ' id="' + childKind + '-' + child + '"/> ');
          res.push('<a href="#uiNode:' + childKind + '-' + child + '">' +
                   child + '</a>');
        }
        res.push("</li>");
      });
    res.push("</ul>");
  }
  gen("/");
  return res.join("");
}
