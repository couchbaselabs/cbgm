allTests = window.allTests || [];
allTests.push(mapTests);
function tests() { _.each(allTests, function(f) { f(); }); }

function mapTests() {
  module("mapTests.basic");

  test("filterNodesByUsage", function() {
      var all = { usage: [] };
      var x = { usage: ["x"] };
      var notx = { usage: ["-x"] };
      var y = { usage: ["y"] };
      var xy = { usage: ["x", "y"] };
      var xnoty = { usage: ["x", "-y"] };

      deepEqual([], filterNodesByUsage([], "x"));
      deepEqual([all], filterNodesByUsage([all], "x"));
      deepEqual([x], filterNodesByUsage([x], "x"));
      deepEqual([all, x, xy, xnoty],
                filterNodesByUsage([all, x, notx, y, xy, xnoty], "x"));
      deepEqual([all, notx, y, xy],
                filterNodesByUsage([all, x, notx, y, xy, xnoty], "y"));
      deepEqual([all, notx],
                filterNodesByUsage([all, x, notx, y, xy, xnoty], "z"));
    });
}
