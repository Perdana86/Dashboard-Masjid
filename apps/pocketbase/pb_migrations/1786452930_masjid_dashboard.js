/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    // --- users: closed sign-up, seed one admin ---
    const users = app.findCollectionByNameOrId("users");
    users.createRule = null;
    users.listRule = "id = @request.auth.id";
    users.viewRule = "id = @request.auth.id";
    users.updateRule = "id = @request.auth.id";
    users.deleteRule = null;
    app.save(users);

    try {
      app.findAuthRecordByEmail("users", "admin@masjid.id");
    } catch (_) {
      const admin = new Record(users);
      admin.setEmail("admin@masjid.id");
      admin.setPassword("MasjidNur#2026");
      admin.set("name", "Admin Masjid");
      admin.set("verified", true);
      app.save(admin);
    }

    // --- settings (single record, public read) ---
    let settings;
    try {
      settings = app.findCollectionByNameOrId("settings");
    } catch (_) {
      settings = new Collection({
        type: "base",
        name: "settings",
        listRule: "",
        viewRule: "",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: null,
        fields: [
          { name: "mosque_name", type: "text", max: 120 },
          { name: "tagline", type: "text", max: 200 },
          { name: "address", type: "text", max: 300 },
          {
            name: "logo",
            type: "file",
            maxSelect: 1,
            maxSize: 5242880,
            mimeTypes: [
              "image/png",
              "image/jpeg",
              "image/webp",
              "image/svg+xml",
            ],
          },
          { name: "running_text", type: "text", max: 2000 },
          { name: "quote", type: "text", max: 400 },
          { name: "quote_source", type: "text", max: 120 },
          { name: "city_id", type: "text", max: 10 },
          { name: "city_name", type: "text", max: 120 },
          { name: "accent", type: "text", max: 40 },
          { name: "slide_seconds", type: "number", min: 3, max: 120 },
          {
            name: "created",
            type: "autodate",
            onCreate: true,
            onUpdate: false,
          },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
      });
      app.save(settings);
    }

    if (
      app.findRecordsByFilter("settings", "id != ''", "", 1, 0).length === 0
    ) {
      const s = new Record(settings);
      s.set("mosque_name", "Masjid Nurul Iman");
      s.set("tagline", "Jamaah Sejuk, Hati Teduh");
      s.set("address", "Jl. Kenanga Raya No. 24, Jakarta Selatan");
      s.set(
        "running_text",
        "Selamat datang di Masjid Nurul Iman. Kajian rutin setiap Ahad pagi ba'da Subuh bersama Ustadz Abdul Hakim. | Jadwal TPQ anak: Senin - Kamis pukul 16.00 WIB. | Mari jaga ketenangan dan kebersihan masjid, matikan nada dering ponsel Anda.",
      );
      s.set(
        "quote",
        "Sesungguhnya shalat itu mencegah dari perbuatan keji dan mungkar.",
      );
      s.set("quote_source", "QS. Al-Ankabut: 45");
      s.set("city_id", "1301");
      s.set("city_name", "KOTA JAKARTA");
      s.set("accent", "#c9a227");
      s.set("slide_seconds", 8);
      app.save(s);
    }

    // --- slides (public read) ---
    let slides;
    try {
      slides = app.findCollectionByNameOrId("slides");
    } catch (_) {
      slides = new Collection({
        type: "base",
        name: "slides",
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
            maxSize: 10485760,
            mimeTypes: ["image/png", "image/jpeg", "image/webp"],
          },
          { name: "image_url", type: "text", max: 500 },
          { name: "position", type: "number" },
          { name: "active", type: "bool" },
          {
            name: "created",
            type: "autodate",
            onCreate: true,
            onUpdate: false,
          },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
        indexes: ["CREATE INDEX idx_slides_position ON slides (position)"],
      });
      app.save(slides);
    }

    if (app.findRecordsByFilter("slides", "id != ''", "", 1, 0).length === 0) {
      const seeds = [
        {
          title: "Kajian Rutin Ahad Pagi",
          caption:
            "Bersama Ustadz Abdul Hakim, ba'da Subuh di ruang utama masjid.",
          image_url: "", // Upload gambar melalui admin panel
          position: 1,
        },
        {
          title: "Pendaftaran TPQ Anak",
          caption:
            "Kelas mengaji Senin - Kamis pukul 16.00 WIB. Info di sekretariat masjid.",
          image_url: "", // Upload gambar melalui admin panel
          position: 2,
        },
        {
          title: "Bakti Sosial Jumat Berkah",
          caption:
            "Pembagian paket sembako untuk warga sekitar setiap Jumat ba'da Jumatan.",
          image_url: "", // Upload gambar melalui admin panel
          position: 3,
        },
      ];

      seeds.forEach((seed) => {
        const rec = new Record(slides);
        rec.set("title", seed.title);
        rec.set("caption", seed.caption);
        rec.set("image_url", seed.image_url);
        rec.set("position", seed.position);
        rec.set("active", true);
        app.save(rec);
      });
    }
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId("slides"));
    } catch (_) {
      /* noop */
    }
    try {
      app.delete(app.findCollectionByNameOrId("settings"));
    } catch (_) {
      /* noop */
    }
  },
);
