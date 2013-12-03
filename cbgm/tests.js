function tests() {
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
};
