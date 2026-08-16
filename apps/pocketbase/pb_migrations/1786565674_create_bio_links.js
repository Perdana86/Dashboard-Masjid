/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    let collection;
    try {
      collection = app.findCollectionByNameOrId("bio_links");
    } catch (_) {
      collection = new Collection({
        type: "base",
        name: "bio_links",
        // Public read (link buttons shown on the public /bio page),
        // admin-only writes.
        listRule: "",
        viewRule: "",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: "label", type: "text", required: true, max: 120 },
          { name: "url", type: "url", required: true, max: 500 },
          {
            name: "icon",
            type: "file",
            maxSelect: 1,
            maxSize: 5242880,
            mimeTypes: [
              "image/png",
              "image/jpeg",
              "image/svg+xml",
              "image/x-icon",
              "image/vnd.microsoft.icon",
              "image/webp",
            ],
          },
          { name: "position", type: "number" },
          { name: "active", type: "bool" },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
        indexes: [
          "CREATE INDEX idx_bio_links_position ON bio_links (position)",
        ],
      });
      app.save(collection);
    }
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId("bio_links");
      app.delete(collection);
    } catch (e) {
      if (e.message && e.message.includes("no rows in result set")) {
        console.log("bio_links not found, skipping revert");
        return;
      }
      throw e;
    }
  },
);
