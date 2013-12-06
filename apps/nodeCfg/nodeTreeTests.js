allTests = window.allTests || [];
allTests.push(nodeTreeTests);
function tests() { _.each(allTests, function(f) { f(); }); }

function nodeTreeTests() {
  module("nodeTreeTests");

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
};
