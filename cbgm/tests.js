function tests() {
  module("basic");

  test("ok", function() {
      ok(true);
    });

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

  test("findAncestor", function() {
      var parents = { A1a: "A1", A1: "A" };
      equal("A1a", findAncestor("A1a", parents, 0));
      equal("A1", findAncestor("A1a", parents, 1));
      equal("A", findAncestor("A1a", parents, 2));
      equal(undefined, findAncestor("A1a", parents, 3));
      equal(undefined, findAncestor("A1a", parents, 4));
      equal("are you my mother?", findAncestor("are you my mother?", parents, 0));
      equal(undefined, findAncestor("are you my mother?", parents, 1));
    });

  test("findLeaves", function() {
      var parents = { A1a: "A1", A1b: "A1", A1: "A", A2: "A", A2a: "A2", A2b: "A2" };
      var children = mapParentsToMapChildren(parents);
      deepEqual(["A1a"], findLeaves("A1a", children));
      deepEqual(["A1a", "A1b"], findLeaves("A1", children));
      deepEqual(["A1a", "A1b", "A2a", "A2b"], findLeaves("A", children));
    });

  test("countStateNodes", function() {
      deepEqual(countStateNodes({ "0": { "master": ["a"], "slave": ["b", "c"] },
                                  "1": { "master": ["b"], "slave": ["c"] } }),
                { "master": { "a": 1, "b": 1 },
                  "slave": { "b": 1, "c": 2 } });
    });

  module("rebalance");

  test("basic-masterSlave", function() {
      var ctx = g_ctx;
      if (!ctx) {
        return;
      }

      // -----------------------------------------------------------
      var prevBucketEvents = ctx.newObj("bucketEvents").result;
      var wantPartitionParams = ctx.newObj("partitionParams", {
        keyFunc: "hash-crc32",
        model: "masterSlave",
        nodes: ["a"],
        numPartitions: 10,
        constraints: { slave: 1 },
        weights: {},
        hierarchy: {},
        hierarchyRules: {}
      }).result;
      var res = rebalanceMap(ctx, {
        prevBucketEvents: prevBucketEvents,
        wantPartitionParams: wantPartitionParams
      });
      ok(!res.err);
      ok(res.nextBucketEvents);
      ok(res.nextBucketEvents.events.length > res.prevBucketEvents.events.length);

      var pm = res.nextBucketEvents.events[0];
      var pp = res.nextBucketEvents.events[1];
      equal(pm.class, "partitionMap");
      equal(pp.class, "partitionParams");

      equal(pm.nodes.length, 1, "just 1 node");
      equal(_.size(pm.partitions), 10, "10 partitions");

      deepEqual(countStatePartitions(pm.partitions),
                { master: 10 });

      deepEqual(countStateNodes(pm.partitions), { master: { 0: 10 } });

      // -----------------------------------------------------------
      prevBucketEvents = res.nextBucketEvents;
      wantPartitionParams = ctx.newObj("partitionParams", {
        keyFunc: "hash-crc32",
        model: "masterSlave",
        nodes: ["a", "b"], // Add one more node.
        numPartitions: 10,
        constraints: { slave: 1 },
        weights: {},
        hierarchy: {},
        hierarchyRules: {}
      }).result;

      res = rebalanceMap(ctx, {
        prevBucketEvents: prevBucketEvents,
        wantPartitionParams: wantPartitionParams
      });
      ok(!res.err);
      ok(res.nextBucketEvents);
      ok(res.nextBucketEvents.events.length > res.prevBucketEvents.events.length);

      pm = res.nextBucketEvents.events[0];
      pp = res.nextBucketEvents.events[1];
      equal(pm.class, "partitionMap");
      equal(pp.class, "partitionParams");

      equal(pm.nodes.length, 2, "now 2 nodes");
      equal(_.size(pm.partitions), 10, "still 10 partitions");

      deepEqual(countStatePartitions(pm.partitions),
                { master: 10, slave: 10 });

      deepEqual(countStateNodes(pm.partitions),
                { master: { 0: 5, 1: 5 }, slave: { 0: 5, 1: 5 } });

      // -----------------------------------------------------------
      prevBucketEvents = res.nextBucketEvents;
      wantPartitionParams = ctx.newObj("partitionParams", {
        keyFunc: "hash-crc32",
        model: "masterSlave",
        nodes: ["a", "B"], // Swap rebalance.
        numPartitions: 10,
        constraints: { slave: 1 },
        weights: {},
        hierarchy: {},
        hierarchyRules: {}
      }).result;

      res = rebalanceMap(ctx, {
        prevBucketEvents: prevBucketEvents,
        wantPartitionParams: wantPartitionParams
      });
      ok(!res.err);
      ok(res.nextBucketEvents);
      ok(res.nextBucketEvents.events.length > res.prevBucketEvents.events.length);

      pm = res.nextBucketEvents.events[0];
      pp = res.nextBucketEvents.events[1];
      equal(pm.class, "partitionMap");
      equal(pp.class, "partitionParams");

      equal(pm.nodes.length, 2, "now 2 nodes");
      equal(_.size(pm.partitions), 10, "still 10 partitions");

      deepEqual(countStatePartitions(pm.partitions),
                { master: 10, slave: 10 });

      deepEqual(countStateNodes(pm.partitions),
                { master: { 0: 5, 1: 5 }, slave: { 0: 5, 1: 5 } });

      // -----------------------------------------------------------
      prevBucketEvents = res.nextBucketEvents;
      wantPartitionParams = ctx.newObj("partitionParams", {
        keyFunc: "hash-crc32",
        model: "masterSlave",
        nodes: ["a", "B", "c"], // A third node.
        numPartitions: 10,
        constraints: { slave: 1 },
        weights: {},
        hierarchy: {},
        hierarchyRules: {}
      }).result;

      res = rebalanceMap(ctx, {
        prevBucketEvents: prevBucketEvents,
        wantPartitionParams: wantPartitionParams
      });
      ok(!res.err);
      ok(res.nextBucketEvents);
      ok(res.nextBucketEvents.events.length > res.prevBucketEvents.events.length);

      pm = res.nextBucketEvents.events[0];
      pp = res.nextBucketEvents.events[1];
      equal(pm.class, "partitionMap");
      equal(pp.class, "partitionParams");

      equal(pm.nodes.length, 3, "now 3 nodes");
      equal(_.size(pm.partitions), 10, "still 10 partitions");

      deepEqual(countStatePartitions(pm.partitions),
                { master: 10, slave: 10 });
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
