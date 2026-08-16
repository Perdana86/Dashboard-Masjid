/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    for (const name of ["slides", "dashboard_slides"]) {
      const col = app.findCollectionByNameOrId(name);

      // Add "video" as a new slide_type option (alongside image/text)
      const slideTypeField = col.fields.getByName("slide_type");
      if (slideTypeField) {
        const values = slideTypeField.values || [];
        if (!values.includes("video")) {
          slideTypeField.values = [...values, "video"];
        }
      }

      // Video file upload field (MP4, WebM, Ogg up to 200MB)
      col.fields.add(
        new FileField({
          name: "video",
          maxSelect: 1,
          maxSize: 209715200,
          mimeTypes: [
            "video/mp4",
            "video/webm",
            "video/ogg",
            "video/quicktime",
            "video/x-matroska",
            "video/x-msvideo",
          ],
        }),
      );

      // Optional external video URL
      col.fields.add(
        new TextField({
          name: "video_url",
          max: 500,
        }),
      );

      app.save(col);
    }
  },
  (app) => {
    for (const name of ["slides", "dashboard_slides"]) {
      const col = app.findCollectionByNameOrId(name);

      const slideTypeField = col.fields.getByName("slide_type");
      if (slideTypeField && Array.isArray(slideTypeField.values)) {
        slideTypeField.values = slideTypeField.values.filter((v) => v !== "video");
      }

      for (const f of ["video", "video_url"]) {
        try { col.fields.removeByName(f); } catch (_) {}
      }

      app.save(col);
    }
  },
);
