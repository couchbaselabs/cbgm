function renderObj(ctx, r, obj, extras) {
  r.set(_.defaults(extras || {}, {
        "obj": obj,
        "objJSON": JSON.stringify(obj),
        "objEdit": _.clone(obj),
        "objEditErrs": null,
        "doEdit": false
      }));
}

function findObjByNameOrIdent(ctx, className, nameOrIdent, nameProp) {
  var nameProp = nameProp || "name";
  var name = (nameOrIdent || "").split("-")[1] || nameOrIdent;
  return ctx.findObj(where).result;
  function where(o) { return o.class == className && o[nameProp] == name; }
}

function instances(ctx, className) {
  return ctx.filterObjs(function(o) { return o.class == className; }).result;
}

function newNamedObjEventHandler(ctx, page, className, cb, props) {
  return function(event) {
    var names = _.compact($("#" + className + "_name").val().split(","));
    var errs = _.compact(_.map(names, function(name) {
          if (!name) {
            return "error: " + className + " name is missing";
          }
          if (findObjByNameOrIdent(ctx, className, name)) {
            return "error: " + className + " (" + name + ") is already exists";
          }
        }));
    if (!_.isEmpty(errs)) {
      return alert(errs.join("\n"));
    }
    var ident;
    _.each(names, function(name) {
        ident = className + "-" + name;
        var params = _.reduce(props || [], function(r, prop) {
            r[prop[0]] =
              prop[1]($("#" + className + "_" + prop[0]).val() || prop[2] || "");
            return r;
          }, { "name": name });
        ctx.setObj(ident, ctx.newObj(className, params).result);
      });
    _.each(props, function(prop) { $("#" + className + "_" + prop[0]).val(""); });
    $("#" + className + "_name").val("");
    cb(ctx, page, ident);
  }
}
