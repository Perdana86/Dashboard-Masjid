/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    // Create a separate collection for dashboard slideshow,
    // distinct from `slides` which is used by the /informasi page.
    let dashboardSlides;
    try {
      dashboardSlides = app.findCollectionByNameOrId("dashboard_slides");
    } catch (_) {
      dashboardSlides = new Collection({
        type: "base",
        name: "dashboard_slides",
        listRule: "",
        viewRule: "",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: "title", type: "text", max: 160 },
          { name: "caption", type: "text", max: 400 },
          {
            name: "image",
            type: "file",
            maxSelect: 1,
            maxSize: 20971520,
            mimeTypes: [
              "image/png",
              "image/jpeg",
              "image/webp",
              "image/gif",
              "image/bmp",
              "image/svg+xml",
              "image/avif",
              "image/tiff",
              "application/pdf",
            ],
          },
          { name: "image_url", type: "text", max: 500 },
          { name: "position", type: "number" },
          { name: "active", type: "bool" },
          {
            name: "media_type",
            type: "select",
            maxSelect: 1,
            values: ["auto", "image", "pdf"],
          },
          {
            name: "created",
            type: "autodate",
            onCreate: true,
            onUpdate: false,
          },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
        indexes: [
          "CREATE INDEX idx_dashboard_slides_position ON dashboard_slides (position)",
        ],
      });
      app.save(dashboardSlides);
    }

    // Seed a couple of starter dashboard slides if empty
    if (
      app.findRecordsByFilter("dashboard_slides", "id != ''", "", 1, 0)
        .length === 0
    ) {
      const seeds = [
        {
          title: "Selamat Datang",
          caption: "Mari jaga ketenangan dan kebersihan masjid.",
          image_url: "", // Upload gambar melalui admin panel
          position: 1,
        },
        {
          title: "Jadwal Kajian",
          caption: "Kajian rutin setiap Ahad pagi ba'da Subuh.",
          image_url: "", // Upload gambar melalui admin panel
          position: 2,
        },
      ];
      seeds.forEach((seed) => {
        const rec = new Record(dashboardSlides);
        rec.set("title", seed.title);
        rec.set("caption", seed.caption);
        rec.set("image_url", seed.image_url);
        rec.set("position", seed.position);
        rec.set("active", true);
        rec.set("media_type", "auto");
        app.save(rec);
      });
    }
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId("dashboard_slides"));
    } catch (_) {
      /* noop */
    }
  },
);
