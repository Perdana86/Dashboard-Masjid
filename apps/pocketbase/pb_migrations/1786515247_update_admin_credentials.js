/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");

    // Migration 1786452930_masjid_dashboard.js already created admin with email admin@masjid.id
    // This migration updates those credentials
    const oldEmail = "admin@masjid.id";
    const newEmail = $os.getenv("PB_SUPERUSER_EMAIL") || "admin@admin.com";

    // Find the existing admin by old email
    let admin;
    try {
      admin = app.findAuthRecordByEmail("users", oldEmail);
    } catch (e) {
      // If old email not found, check if already updated to new email
      try {
        admin = app.findAuthRecordByEmail("users", newEmail);
        // Already updated, skip
        return;
      } catch (e2) {
        throw new Error(
          `Admin user not found with email ${oldEmail} or ${newEmail} — please run masjid_dashboard migration first`,
        );
      }
    }

    admin.setEmail(newEmail);
    admin.setPassword($os.getenv("PB_SUPERUSER_PASSWORD") || "password123");
    admin.set("name", "Admin Masjid");
    admin.set("verified", true);
    app.save(admin);
  },
  (app) => {
    // Revert back to the original credentials.
    let admin;
    try {
      admin = app.findAuthRecordByEmail("users", "admin@admin.com");
    } catch (_) {
      return;
    }
    admin.setEmail("admin@admin.com");
    admin.setPassword("password");
    app.save(admin);
  },
);
