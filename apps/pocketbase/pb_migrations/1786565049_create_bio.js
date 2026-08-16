/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    let collection;
    try {
      collection = app.findCollectionByNameOrId("bio");
    } catch (_) {
      collection = new Collection({
        type: "base",
        name: "bio",
        // Public read (the /bio page is visible to everyone), auth-only writes.
        listRule: "",
        viewRule: "",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: null,
        fields: [
          { name: "mosque_name", type: "text", max: 160 },
          { name: "description", type: "text", max: 600 },
          { name: "address", type: "text", max: 400 },
          { name: "phone", type: "text", max: 60 },
          { name: "email", type: "email", max: 120 },
          { name: "operating_hours", type: "text", max: 400 },
          {
            name: "photo",
            type: "file",
            maxSelect: 1,
            maxSize: 10485760,
            mimeTypes: [
              "image/png",
              "image/jpeg",
              "image/webp",
              "image/gif",
              "image/svg+xml",
              "image/avif",
            ],
          },
          { name: "long_description", type: "text", max: 5000 },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
      });
      app.save(collection);
    }
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId("bio");
      app.delete(collection);
    } catch (e) {
      if (e.message && e.message.includes("no rows in result set")) {
        return;
      }
      throw e;
    }
  },
);
