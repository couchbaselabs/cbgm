function renderObj(ctx, r, obj, extras) {
  r.set(_.defaults(extras || {}, {
        "obj": obj,
        "objEdit": _.clone(obj),
        "objEditErrs": null,
        "doEdit": false
      }));
  r.set("objJSON", JSON.stringify(obj));
}

function findObj(ctx, objs, className, nameOrIdent) {
  var name = (nameOrIdent || "").split("-")[1] || nameOrIdent;
  return _.find(objs, where) || ctx.findObj(where).result;
  function where(n) { return n.class == className && n.name == name; };
}

