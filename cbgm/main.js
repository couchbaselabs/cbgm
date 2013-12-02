function main(ctx, page) {
  sortEvents(page.obj);
  page.want = page.want ||
    { keyFunc: "hash-crc32",
      model: "masterSlave",
      nodes: "a",
      numPartitions: 10,
      constraints: 1,
      weights: "{}",
      hierarchy: "{}",
      hierarchyRules: "{}"
    };
  page.visualBucketEvent = visualBucketEvent;
  page.r = registerEventHandlers(ctx, page.render("main"));
  refresh(page.r, page.obj);
}

var modelToConstraints = {
  masterSlave: "slave",
  multiMaster: "master"
}

function registerEventHandlers(ctx, r) {
  r.on({
    "rebalanceMap": function(event) {
      var obj = r.get("obj");
      if (obj.class != "bucketEvents") {
        return alert("error: obj is not a bucketEvents");
      }
      var want = r.get("want");
      var params = {
        keyFunc: want.keyFunc,
        model: want.model,
        nodes: want.nodes.split(','),
        numPartitions: parseInt(want.numPartitions),
        constraints: {},
        weights: JSON.parse(want.weights),
        hierarchy: JSON.parse(want.hierarchy),
        hierarchyRules: JSON.parse(want.hierarchyRules)
      };
      params.constraints[modelToConstraints[params.model]] =
        parseInt(want.constraints);
      var res = rebalanceMap(ctx, {
        prevBucketEvents: deepClone(obj),
        wantPartitionParams: ctx.newObj("partitionParams", params).result }) ||
        { err: "unexpected rebalance error" };
      console.log(res);
      if (res.err) {
        return alert("error: " + res.err);
      }
      if (res.nextBucketEvents) {
        refresh(r, res.nextBucketEvents, res.warnings);
      }
    },
    "scheduleMoves": function(event) {
      var bucketEvents = r.get("obj");
      if (bucketEvents.class != "bucketEvents") {
        return alert("error: obj is not a bucketEvents");
      }
      var bucketEventEndIdx;
      var bucketEventEnd = _.find(bucketEvents.events, function(be, idx) {
          bucketEventEndIdx = idx;
          return be.class == "partitionMap" && be.when == event.node.id;
        });
      var bucketEventBeg = bucketEvents.events[bucketEventEndIdx + 1];
      r.set("schedule",
            JSON.stringify(bucketEventEnd) + JSON.stringify(bucketEventBeg));
    },
  });
  return r;
}

function refresh(r, obj, warnings) {
  sortEvents(obj);
  r.set({ obj: obj, objJSON: JSON.stringify(obj), warnings: warnings });
}

function sortEvents(obj) {
  if (obj.events) {
    obj.events = sortDesc(obj.events, "when");
  }
}

function visualBucketEvent(be) {
  var res = [];
  res.push('<div class="bucketEvent_when">' + be.when + '</div>');
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
      _.each(partition, function(partitionState, state) {
          if (_.contains(partitionState, nodeIdx)) {
            res.push('<div class="' + state + '"></div>');
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

function deepClone(x) {
  return JSON.parse(JSON.stringify(x));
}
