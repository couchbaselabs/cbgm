function nodeHierarchy(ctx, className, nodeNames,
                       mapContainerParent, mapContainerChildren) {
  _.each(nodeNames, function(nodeName) {
      var node = ctx.getObj(className + "-" + nodeName).result;
      if (!node) {
        return;
      }
      var parent = "/";
      if (node.container) {
        _.each(node.container.split("/"), function(x) {
            var p = parent + x + "/";
            mapContainerChildren[parent] = mapContainerChildren[parent] || {};
            mapContainerChildren[parent][p] = "nodeContainer";
            mapContainerParent[p] = parent;
            parent = p;
          });
      }
      mapContainerChildren[parent] = mapContainerChildren[parent] || {};
      mapContainerChildren[parent][node.name] = node.class;
      mapContainerParent[node.name] = parent;
    });
}
