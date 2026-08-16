/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const settings = app.findCollectionByNameOrId("settings");

    if (!settings.fields.getByName("pwa_app_name")) {
      settings.fields.add(
        new TextField({
          name: "pwa_app_name",
          max: 120,
          min: 0,
        }),
      );
    }

    if (!settings.fields.getByName("pwa_short_name")) {
      settings.fields.add(
        new TextField({
          name: "pwa_short_name",
          max: 60,
          min: 0,
        }),
      );
    }

    if (!settings.fields.getByName("pwa_description")) {
      settings.fields.add(
        new TextField({
          name: "pwa_description",
          max: 500,
          min: 0,
        }),
      );
    }

    if (!settings.fields.getByName("pwa_theme_color")) {
      settings.fields.add(
        new TextField({
          name: "pwa_theme_color",
          max: 40,
          min: 0,
        }),
      );
    }

    if (!settings.fields.getByName("pwa_bg_color")) {
      settings.fields.add(
        new TextField({
          name: "pwa_bg_color",
          max: 40,
          min: 0,
        }),
      );
    }

    if (!settings.fields.getByName("pwa_logo")) {
      settings.fields.add(
        new FileField({
          name: "pwa_logo",
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
      ["pwa_app_name", "pwa_short_name", "pwa_description", "pwa_theme_color", "pwa_bg_color", "pwa_logo"].forEach(
        (name) => {
          if (settings.fields.getByName(name)) {
            settings.fields.removeByName(name);
          }
        },
      );
      app.save(settings);
    } catch (_) {
      /* noop */
    }
  },
);
