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
