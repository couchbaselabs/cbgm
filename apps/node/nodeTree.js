// The includeLevel is tree ancestor inclusion level, and excludeLevel
// is tree ancestor exclusion level.  Example: includeLevel of 2 and
// excludeLevel of 1 means include nodes with the same grandparent
// (level 2), but exclude nodes with the same parent (level 1).
function includeExcludeNodes(node, includeLevel, excludeLevel,
                             mapParents, mapChildren) {
  var incNodes = findLeaves(findAncestor(node, mapParents, includeLevel), mapChildren);
  var excNodes = findLeaves(findAncestor(node, mapParents, excludeLevel), mapChildren);
  return _.difference(incNodes, excNodes);
}

function findAncestor(node, mapParents, level) {
  while (level > 0) {
    node = mapParents[node];
    level--;
  }
  return node;
}

function findLeaves(node, mapChildren) {
  if (!node) {
    return [];
  }
  var children = mapChildren[node];
  if (!children) {
    return [node];
  }
  return _.flatten(_.map(children,
                         function(c) { return findLeaves(c, mapChildren); }));
}

function mapParentsToMapChildren(mapParents) {
  return _.reduce(mapParents,
                  function(mapChildren, parent, child) {
                    mapChildren[parent] = mapChildren[parent] || [];
                    mapChildren[parent].push(child);
                    return mapChildren;
                  }, {})
}
