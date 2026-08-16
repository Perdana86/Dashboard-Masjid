/// <reference path="../pb_data/types.d.ts" />

migrate(
    (app) => {
        const users = app.findCollectionByNameOrId("users");

        // Find the existing admin by the old email; if not found, look for the
        // new email in case this migration already ran (idempotent).
        let admin;
        try {
            admin = app.findAuthRecordByEmail("users", "admin@masjid.id");
        } catch (_) {
            try {
                admin = app.findAuthRecordByEmail("users", "masjid@alamanahkeu.site");
            } catch (e) {
                throw new Error(
                    "Admin user not found by either old or new email — seed it first",
                );
            }
        }

        admin.setEmail("masjid@alamanahkeu.site");
        admin.setPassword("MasjidAlamanahkeu#2026");
        admin.set("name", "Admin Masjid");
        admin.set("verified", true);
        app.save(admin);
    },
    (app) => {
        // Revert back to the original credentials.
        let admin;
        try {
            admin = app.findAuthRecordByEmail("users", "masjid@alamanahkeu.site");
        } catch (_) {
            return;
        }
        admin.setEmail("admin@masjid.id");
        admin.setPassword("MasjidNur#2026");
        app.save(admin);
    },
);
