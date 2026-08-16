/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = new Collection({
      type: "base",
      name: "activities",
      // Public read (halaman /activity), admin-only write.
      listRule: "",
      viewRule: "",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: "title", type: "text", required: true, max: 200 },
        { name: "description", type: "text", max: 2000 },
        {
          name: "image",
          type: "file",
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml", "image/avif"],
        },
        {
          name: "video_local",
          type: "file",
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
        },
        { name: "video_youtube", type: "text", max: 500 },
        { name: "position", type: "number" },
        { name: "active", type: "bool" },
        { name: "created", type: "autodate", onCreate: true, onUpdate: false },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
      indexes: ["CREATE INDEX idx_activities_position ON activities (position)"],
    });
    app.save(collection);
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId("activities");
      app.delete(collection);
    } catch (e) {
      if (e.message.includes("no rows in result set")) return;
      throw e;
    }
  },
);
