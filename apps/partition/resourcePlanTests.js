allTests = window.allTests || [];
allTests.push(resourcePlanTests);
function tests() { _.each(allTests, function(f) { f(); }); }

function resourcePlanTests() {
  module("resourcePlanTests.basic");

  test("sortDesc", function() {
      deepEqual([{x: 3}, {x: 2}, {x: 1}], sortDesc([{x: 1}, {x: 2}, {x: 3}], 'x'));
    });

  test("run", function() {
      deepEqual({x: 222},
                run(null, {x: 222}));
      deepEqual({x: 100, err:"whoa"},
                run(null, {},
                    function(ctx, req) { req.x = 100; },
                    function(ctx, req) { req.err = "whoa"; },
                    function(ctx, req) { req.x = 200; }));
    });

  test("partitionsMap", function() {
      deepEqual({ "0": { "master": [1], "slave": [2, 3] } },
                partitionsMap({ "0": { "master": ["a"], "slave": ["bb", "ccc"] } },
                              function(x) { return x.length; }));
      deepEqual({ "0": { "master": [1], "slave": [2, 3] },
                  "1": { "master": [1], "slave": [2, 4], "dead": [] }},
        partitionsMap({ "0": { "master": ["a"], "slave": ["bb", "ccc"] },
                        "1": { "master": ["a"], "slave": ["bb", "cccc"], "dead": [] }},
                              function(x) { return x.length; }));
    });

  test("partitionsWithNodeNamesIndexes", function() {
      var nodes = ["a", "b"];
      var partitions = { "0": { "master": [0, 1], "slave": [1], "dead": [] } };
      deepEqual(partitions,
                partitionsWithNodeIndexes(partitionsWithNodeNames(partitions, nodes),
                                          nodes));
    });

  test("removeNodesFromPartition", function() {
      var nodes = ["a", "b"];
      var partitions = { "master": [0, 1], "slave": [1], "dead": [] };
      deepEqual(partitions,
                removeNodesFromPartition(partitions, []));
      deepEqual(partitions,
                removeNodesFromPartition(partitions, [2, 3]));
      deepEqual({ "master": [0], "slave": [], "dead": [] },
                removeNodesFromPartition(partitions, [1]));
      deepEqual({ "master": [], "slave": [], "dead": [] },
                removeNodesFromPartition(partitions, [0, 1]));
      deepEqual({ "master": [], "slave": [], "dead": [] },
                removeNodesFromPartition(partitions, [1, 0]));
    });

  test("countStateNodes", function() {
      deepEqual(countStateNodes({ "0": { "master": ["a"], "slave": ["b", "c"] },
                                  "1": { "master": ["b"], "slave": ["c"] } }),
                { "master": { "a": 1, "b": 1 },
                  "slave": { "b": 1, "c": 2 } });
    });

  module("resourcePlanTests.rebalance");

  test("basic-masterSlave", function() {
      var ctx = g_ctx;
      if (!ctx) {
        return;
      }

      // -----------------------------------------------------------
      var prevResourceEvents = ctx.newObj("resourceEvents").result;
      var wantPartitionParams = ctx.newObj("partitionParams", {
        keyFunc: "hash-crc32",
        model: "masterSlave",
        nodes: ["a"],
        numPartitions: 10,
        constraints: { slave: 1 },
        nodeWeights: {},
        partitionWeights: {},
        hierarchy: {},
        hierarchyRules: {}
      }).result;
      var res = rebalanceMap(ctx, {
        prevResourceEvents: prevResourceEvents,
        wantPartitionParams: wantPartitionParams
      });
      ok(!res.err);
      ok(res.nextResourceEvents);
      ok(res.nextResourceEvents.events.length > res.prevResourceEvents.events.length);

      var pm = res.nextResourceEvents.events[0];
      var pp = res.nextResourceEvents.events[1];
      equal(pm.class, "partitionMap");
      equal(pp.class, "partitionParams");

      equal(pm.nodes.length, 1, "just 1 node");
      equal(_.size(pm.partitions), 10, "10 partitions");

      deepEqual(countStatePartitions(pm.partitions),
                { master: 10 });

      deepEqual(countStateNodes(pm.partitions), { master: { 0: 10 } });

      // -----------------------------------------------------------
      prevResourceEvents = res.nextResourceEvents;
      wantPartitionParams = ctx.newObj("partitionParams", {
        keyFunc: "hash-crc32",
        model: "masterSlave",
        nodes: ["a", "b"], // Add one more node.
        numPartitions: 10,
        constraints: { slave: 1 },
        nodeWeights: {},
        partitionWeights: {},
        hierarchy: {},
        hierarchyRules: {}
      }).result;

      res = rebalanceMap(ctx, {
        prevResourceEvents: prevResourceEvents,
        wantPartitionParams: wantPartitionParams
      });
      ok(!res.err);
      ok(res.nextResourceEvents);
      ok(res.nextResourceEvents.events.length > res.prevResourceEvents.events.length);

      pm = res.nextResourceEvents.events[0];
      pp = res.nextResourceEvents.events[1];
      equal(pm.class, "partitionMap");
      equal(pp.class, "partitionParams");

      equal(pm.nodes.length, 2, "now 2 nodes");
      equal(_.size(pm.partitions), 10, "still 10 partitions");

      deepEqual(countStatePartitions(pm.partitions),
                { master: 10, slave: 10 });

      deepEqual(countStateNodes(pm.partitions),
                { master: { 0: 5, 1: 5 }, slave: { 0: 5, 1: 5 } });

      // -----------------------------------------------------------
      prevResourceEvents = res.nextResourceEvents;
      wantPartitionParams = ctx.newObj("partitionParams", {
        keyFunc: "hash-crc32",
        model: "masterSlave",
        nodes: ["a", "B"], // Swap rebalance.
        numPartitions: 10,
        constraints: { slave: 1 },
        nodeWeights: {},
        partitionWeights: {},
        hierarchy: {},
        hierarchyRules: {}
      }).result;

      res = rebalanceMap(ctx, {
        prevResourceEvents: prevResourceEvents,
        wantPartitionParams: wantPartitionParams
      });
      ok(!res.err);
      ok(res.nextResourceEvents);
      ok(res.nextResourceEvents.events.length > res.prevResourceEvents.events.length);

      pm = res.nextResourceEvents.events[0];
      pp = res.nextResourceEvents.events[1];
      equal(pm.class, "partitionMap");
      equal(pp.class, "partitionParams");

      equal(pm.nodes.length, 2, "now 2 nodes");
      equal(_.size(pm.partitions), 10, "still 10 partitions");

      deepEqual(countStatePartitions(pm.partitions),
                { master: 10, slave: 10 });

      deepEqual(countStateNodes(pm.partitions),
                { master: { 0: 5, 1: 5 }, slave: { 0: 5, 1: 5 } });

      // -----------------------------------------------------------
      prevResourceEvents = res.nextResourceEvents;
      wantPartitionParams = ctx.newObj("partitionParams", {
        keyFunc: "hash-crc32",
        model: "masterSlave",
        nodes: ["a", "B", "c"], // A third node.
        numPartitions: 10,
        constraints: { slave: 1 },
        nodeWeights: {},
        partitionWeights: {},
        hierarchy: {},
        hierarchyRules: {}
      }).result;

      res = rebalanceMap(ctx, {
        prevResourceEvents: prevResourceEvents,
        wantPartitionParams: wantPartitionParams
      });
      ok(!res.err);
      ok(res.nextResourceEvents);
      ok(res.nextResourceEvents.events.length > res.prevResourceEvents.events.length);

      pm = res.nextResourceEvents.events[0];
      pp = res.nextResourceEvents.events[1];
      equal(pm.class, "partitionMap");
      equal(pp.class, "partitionParams");

      equal(pm.nodes.length, 3, "now 3 nodes");
      equal(_.size(pm.partitions), 10, "still 10 partitions");

      deepEqual(countStatePartitions(pm.partitions),
                { master: 10, slave: 10 });
    });

  test("50node-masterSlave", function() {
      var ctx = g_ctx;
      if (!ctx) {
        return;
      }

      var prevResourceEvents = ctx.newObj("resourceEvents").result;
      var wantPartitionParams = ctx.newObj("partitionParams", {
        keyFunc: "hash-crc32",
        model: "masterSlave",
         nodes: _.map(_.range(50), String),
        numPartitions: 1024,
        constraints: { slave: 1 },
        nodeWeights: {},
        partitionWeights: {},
        hierarchy: {},
        hierarchyRules: {}
      }).result;
      var res = rebalanceMap(ctx, {
        prevResourceEvents: prevResourceEvents,
        wantPartitionParams: wantPartitionParams
      });
      ok(!res.err);
      ok(res.nextResourceEvents);
      ok(res.nextResourceEvents.events.length > res.prevResourceEvents.events.length);

      var pm = res.nextResourceEvents.events[0];
      var pp = res.nextResourceEvents.events[1];
      equal(pm.class, "partitionMap");
      equal(pp.class, "partitionParams");

      equal(pm.nodes.length, 50, "50 nodes");
      equal(_.size(pm.partitions), 1024, "1024 partitions");

      deepEqual(countStatePartitions(pm.partitions),
                { master: 1024, slave: 1024 });

      var csn = countStateNodes(pm.partitions);
      var max = _.max(csn.master);
      var min = _.min(csn.master);
      ok(max - min <= 1, "master max (" + max + ") 1 or less close to min (" + min + ")");

      max = _.max(csn.slave);
      min = _.min(csn.slave);
      ok(max - min <= 1, "slave max (" + max + ") 1 or less close to min (" + min + ")");
    });

  function countStatePartitions(partitions) {
    return _.reduce(countStateNodes(partitions),
                    function(r, nodeCounts, state) {
                      r[state] = _.reduce(nodeCounts, function(s, c) {
                          return s + c;
                        }, 0);
                      return r;
                    }, {});
  }
};
