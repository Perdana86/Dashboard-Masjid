/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const settings = app.findCollectionByNameOrId("settings");

    if (!settings.fields.getByName("favicon")) {
      settings.fields.add(
        new FileField({
          name: "favicon",
          maxSelect: 1,
          maxSize: 5242880, // 5 MB
          mimeTypes: [
            "image/png",
            "image/jpeg",
            "image/svg+xml",
            "image/x-icon",
            "image/vnd.microsoft.icon",
          ],
        }),
      );
    }

    app.save(settings);
  },
  (app) => {
    try {
      const settings = app.findCollectionByNameOrId("settings");
      if (settings.fields.getByName("favicon")) {
        settings.fields.removeByName("favicon");
      }
      app.save(settings);
    } catch (_) {
      /* noop */
    }
  },
);
