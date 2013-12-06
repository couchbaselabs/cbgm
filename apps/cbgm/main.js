function main(ctx, page, template) {
  page.sections =
    _.sortBy(ctx.filterObjs(function(o) { return o.class == "section"; }).result,
             "displayOrder");
  page.r = page.render(template || "main");
}
