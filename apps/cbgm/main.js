function main(ctx, page, template) {
  sortEvents(page.obj);
  page.sections =
    _.sortBy(ctx.filterObjs(function(o) { return o.class == "section"; }).result,
             "displayOrder");
  page.visualResourceEvent = visualResourceEvent;
  page.r = page.render(template || "main");
  refresh(page.r, page.obj);
}

function refresh(r, obj, warnings) {
  sortEvents(obj);
  r.set({ obj: obj, objJSON: JSON.stringify(obj), warnings: warnings });
}

function sortEvents(obj) {
  if (obj.events) {
    obj.events = sortDesc(obj.events, "when");
  }
}

function deepClone(x) {
  return JSON.parse(JSON.stringify(x));
}
