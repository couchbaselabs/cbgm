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
    var names = $("#" + className + "_name").val();
    var ident;
    _.each(names.split(","), function(name) {
        if (!name) {
          return alert("error: " + className + " name is missing");
        }
        if (findObjByNameOrIdent(ctx, className, name)) {
          return alert("error: " + className + " (" + name + ") is already known");
        }
        ident = className + "-" + name;
        var params = _.reduce(props || [], function(r, prop) {
            var val = prop[1]($("#" + className + "_" + (prop[2] || prop[0])).val());
            r[prop[0]] = val;
            return r;
          }, { "name": name });
        ctx.setObj(ident, ctx.newObj(className, params).result);
      });
    _.each(props, function(prop) {
        $("#" + className + "_" + (prop[2] || prop[0])).val("");
      });
    $("#" + className + "_name").val("");
    cb(ctx, page, ident);
  }
}
