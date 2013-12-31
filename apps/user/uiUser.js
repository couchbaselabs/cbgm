// Only U/I related JS goes here.

function uiUser(ctx, page) {
  main(ctx, page, "uiUser");
  uiUserEventHandlers(ctx, page, page.r);
  uiUserRefresh(ctx, page);
}

function uiUserRefresh(ctx, page, ident) {
  var obj = findObjByNameOrIdent(ctx, "user", ident || page.ident) || page.obj;
  renderObj(ctx, page.r, obj, {
    users: _.sortBy(instances(ctx, "user"), "name")
  });
}

function uiUserEventHandlers(ctx, page, r) {
  r.on({
    "newUser": newNamedObjEventHandler(ctx, page, "user", uiUserRefresh,
                                       [ ["roles", function(s) {
                                             return _.compact(s.split(','));
                                           }] ])
  });
}
