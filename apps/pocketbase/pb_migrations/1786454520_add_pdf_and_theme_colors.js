/// <reference path="../pb_data/types.d.ts" />

migrate(
    (app) => {
        // --- slides: accept all image formats + PDF, add media_type ---
        const slides = app.findCollectionByNameOrId("slides");

        const imgField = slides.fields.getByName("image");
        if (imgField) {
            imgField.mimeTypes = [
                "image/png",
                "image/jpeg",
                "image/webp",
                "image/gif",
                "image/bmp",
                "image/svg+xml",
                "image/avif",
                "image/tiff",
                "application/pdf",
            ];
            imgField.maxSize = 20971520; // 20 MB
        }

        if (!slides.fields.getByName("media_type")) {
            slides.fields.add(
                new SelectField({
                    name: "media_type",
                    maxSelect: 1,
                    values: ["auto", "image", "pdf"],
                }),
            );
        }
        app.save(slides);

        // --- settings: theme color fields ---
        const settings = app.findCollectionByNameOrId("settings");
        const addText = (name) => {
            if (!settings.fields.getByName(name)) {
                settings.fields.add(new TextField({ name, max: 40 }));
            }
        };
        addText("theme_bg");
        addText("theme_surface");
        addText("theme_primary");
        addText("theme_text");
        app.save(settings);

        // backfill theme defaults on existing settings rows
        const rows = app.findRecordsByFilter("settings", "id != ''", "", 100, 0);
        rows.forEach((r) => {
            let changed = false;
            if (!r.get("theme_bg")) { r.set("theme_bg", "#04100c"); changed = true; }
            if (!r.get("theme_surface")) { r.set("theme_surface", "#0d2019"); changed = true; }
            if (!r.get("theme_primary")) { r.set("theme_primary", "#c9a227"); changed = true; }
            if (!r.get("theme_text")) { r.set("theme_text", "#ecfdf5"); changed = true; }
            if (changed) app.save(r);
        });
    },
    (app) => {
        try {
            const slides = app.findCollectionByNameOrId("slides");
            const imgField = slides.fields.getByName("image");
            if (imgField) {
                imgField.mimeTypes = ["image/png", "image/jpeg", "image/webp"];
                imgField.maxSize = 10485760;
            }
            if (slides.fields.getByName("media_type")) {
                slides.fields.removeByName("media_type");
            }
            app.save(slides);
        } catch (_) { /* noop */ }
        try {
            const settings = app.findCollectionByNameOrId("settings");
            ["theme_bg", "theme_surface", "theme_primary", "theme_text"].forEach((n) => {
                if (settings.fields.getByName(n)) settings.fields.removeByName(n);
            });
            app.save(settings);
        } catch (_) { /* noop */ }
    },
);
