function visualResourceEvent(be) {
  var res = [];
  res.push('<div class="resourceEvent_when">' + be.when + '</div>');
  res.push('<div class="nodes">');
  res.push('<div class="partitionId"></div>');
  _.each(be.nodes, function(nodeName) {
      res.push('<div class="nodeId">' + nodeName + '</div>');
    });
  res.push('</div>');
  _.each(be.partitions, function(partition, partitionId) {
      res.push('<div class="partition">');
      res.push('<div class="partitionId">' + partitionId + '</div>');
      res.push(visualPartitionNodes(partition, be.nodes));
      res.push('</div>');
    });
  return res.join('\n');
}

function visualPartitionNodes(partition, nodes) {
  var res = [];
  _.each(nodes, function(node, nodeIdx) {
      res.push('<div class="node">');
      var empty = true;
      _.each(partition, function(nodeIdxs, state) {
          var i = nodeIdxs.indexOf(nodeIdx);
          if (i >= 0) {
            res.push('<div class="' + state + ' pos' + i + '"></div>');
            empty = false;
          }
        });
      if (empty) {
        res.push('<div class="null"></div>');
      }
      res.push('</div>');
    });
  return res.join('\n');
}
