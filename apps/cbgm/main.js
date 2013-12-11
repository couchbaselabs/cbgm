function main(ctx, page, template) {
  page.sections = _.sortBy(instances(ctx, "section"), "displayOrder");
  page.r = page.render(template || "main");
}
