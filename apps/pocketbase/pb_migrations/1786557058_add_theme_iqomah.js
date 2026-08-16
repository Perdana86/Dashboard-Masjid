/// <reference path="../pb_data/types.d.ts" />

migrate(
    (app) => {
        const settings = app.findCollectionByNameOrId("settings");
        if (!settings.fields.getByName("theme_iqomah")) {
            settings.fields.add(new TextField({ name: "theme_iqomah", max: 40 }));
        }
        app.save(settings);

        // Backfill default iqomah color
        const rows = app.findRecordsByFilter("settings", "id != ''", "", 100, 0);
        rows.forEach((r) => {
            if (!r.get("theme_iqomah")) {
                r.set("theme_iqomah", "#22c55e");
                app.save(r);
            }
        });
    },
    (app) => {
        try {
            const settings = app.findCollectionByNameOrId("settings");
            if (settings.fields.getByName("theme_iqomah")) {
                settings.fields.removeByName("theme_iqomah");
            }
            app.save(settings);
        } catch (_) {}
    },
);
