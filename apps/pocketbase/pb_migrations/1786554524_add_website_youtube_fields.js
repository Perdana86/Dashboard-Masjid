/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    for (const name of ["slides", "dashboard_slides"]) {
      const col = app.findCollectionByNameOrId(name);

      // Extend slide_type to include website and youtube
      const slideTypeField = col.fields.getByName("slide_type");
      if (slideTypeField) {
        const values = slideTypeField.values || [];
        if (!values.includes("website")) slideTypeField.values = [...values, "website"];
        if (!slideTypeField.values.includes("youtube")) slideTypeField.values = [...slideTypeField.values, "youtube"];
      }

      // Website URL field
      const existingWebsite = col.fields.getByName("website_url");
      if (!existingWebsite) {
        col.fields.add(new TextField({ name: "website_url", max: 1000 }));
      }

      // YouTube URL/ID field
      const existingYoutube = col.fields.getByName("youtube_url");
      if (!existingYoutube) {
        col.fields.add(new TextField({ name: "youtube_url", max: 500 }));
      }

      app.save(col);
    }
  },
  (app) => {
    for (const name of ["slides", "dashboard_slides"]) {
      const col = app.findCollectionByNameOrId(name);

      const slideTypeField = col.fields.getByName("slide_type");
      if (slideTypeField) {
        slideTypeField.values = (slideTypeField.values || []).filter(
          (v) => v !== "website" && v !== "youtube"
        );
      }

      for (const f of ["website_url", "youtube_url"]) {
        try { col.fields.removeByName(f); } catch (_) {}
      }

      app.save(col);
    }
  }
);
