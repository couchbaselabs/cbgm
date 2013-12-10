// The rule is an int, where 10's place is tree ancestor inclusion
// level, and 1's place is tree ancestor exclusion level.  Example: a
// rule value of 21 == 2*10 + 1, means include nodes with the same
// grandparent (level 2), but exclude nodes with the same parent
// (level 1).
function includeExcludeNodes(node, rule, mapParents, mapChildren) {
  var incLevels = Math.floor(rule / 10);
  var excLevels = rule % 10;
  var incNodes = findLeaves(findAncestor(node, mapParents, incLevels), mapChildren);
  var excNodes = findLeaves(findAncestor(node, mapParents, excLevels), mapChildren);
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
