/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    for (const name of ["slides", "dashboard_slides"]) {
      const col = app.findCollectionByNameOrId(name);

      col.fields.add(new SelectField({
        name: "slide_type",
        maxSelect: 1,
        values: ["image", "text"],
      }));

      col.fields.add(new TextField({
        name: "text_content",
        max: 2000,
      }));

      col.fields.add(new TextField({
        name: "text_translation",
        max: 2000,
      }));

      col.fields.add(new TextField({
        name: "text_font_size",
        max: 20,
      }));

      col.fields.add(new TextField({
        name: "text_color",
        max: 40,
      }));

      col.fields.add(new TextField({
        name: "text_bg",
        max: 40,
      }));

      col.fields.add(new SelectField({
        name: "text_align",
        maxSelect: 1,
        values: ["left", "center", "right"],
      }));

      app.save(col);
    }
  },
  (app) => {
    for (const name of ["slides", "dashboard_slides"]) {
      const col = app.findCollectionByNameOrId(name);
      for (const f of ["slide_type", "text_content", "text_translation", "text_font_size", "text_color", "text_bg", "text_align"]) {
        try { col.fields.removeByName(f); } catch (_) {}
      }
      app.save(col);
    }
  },
);
