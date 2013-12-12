function renderObj(ctx, r, obj, extras) {
  r.set(_.defaults(extras || {}, {
        "obj": obj,
        "objJSON": JSON.stringify(obj),
        "objEdit": _.clone(obj),
        "objEditErrs": null,
        "doEdit": false
      }));
}

function findObjByNameOrIdent(ctx, className, nameOrIdent) {
  var name = (nameOrIdent || "").split("-")[1] || nameOrIdent;
  return ctx.findObj(where).result;
  function where(o) { return o.class == className && o.name == name; }
}

function instances(ctx, className) {
  return ctx.filterObjs(function(o) { return o.class == className; }).result;
}

function newNamedObjEventHandler(ctx, page, className, cb) {
  return function(event) {
    var names = (event.node.value || "").trim();
    var ident;
    _.each(names.split(","), function(name) {
        if (!name) {
          return alert("error: " + className + " name is missing");
        }
        if (findObjByNameOrIdent(ctx, className, name)) {
          return alert("error: " + className + " (" + name + ") is already known.");
        }
        ident = className + "-" + name;
        ctx.setObj(ident, ctx.newObj(className, { "name": name }).result);
      });
    event.node.value = "";
    event.node.focus();
    cb(ctx, page, ident);
  }
}
