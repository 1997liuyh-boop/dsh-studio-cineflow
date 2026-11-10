// <define:STUDIO_PROJECT>
var define_STUDIO_PROJECT_default = { name: "\u5F71\u97F3\u5DE5\u4F5C\u5BA4", icon: "\u{1F39E}\uFE0F", description: "CineFlow\uFF1A\u7535\u5F71\u8282\u76EE\u53D1\u73B0\u3001\u7247\u6E90\u7BA1\u7406\u3001\u64AD\u653E\u7EED\u64AD\u4E0E\u5C40\u57DF\u7F51\u6295\u5C4F" };

// packages/sdk/entry.ts
import { fileURLToPath } from "node:url";
var name = "dsh-studio-cineflow";
var inject = ["studioProjects"];
function apply(ctx) {
  ctx.effect(() => ctx.studioProjects.register({ id: "cineflow", ...define_STUDIO_PROJECT_default, root: fileURLToPath(new URL("../static/", import.meta.url)) }), "\u5DE5\u4F5C\u5BA4\uFF1Acineflow");
}
export {
  apply,
  inject,
  name
};
