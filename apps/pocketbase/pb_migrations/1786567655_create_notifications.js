/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    let collection;
    try {
      collection = app.findCollectionByNameOrId("notifications");
    } catch (_) {
      collection = new Collection({
        type: "base",
        name: "notifications",
        // Public dashboard logs notifications without auth, and anyone may
        // read the log. Writes beyond create are not exposed via REST.
        listRule: "",
        viewRule: "",
        createRule: "",
        updateRule: null,
        deleteRule: null,
        fields: [
          { name: "prayer_key", type: "text", max: 20 },
          { name: "prayer_label", type: "text", max: 40 },
          {
            name: "notification_type",
            type: "select",
            maxSelect: 1,
            values: ["sholat", "iqomah"],
          },
          { name: "scheduled_time", type: "text", max: 10 },
          {
            name: "triggered_at",
            type: "date",
          },
          { name: "source", type: "text", max: 40 },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
        indexes: [
          "CREATE INDEX idx_notifications_triggered ON notifications (triggered_at)",
        ],
      });
      app.save(collection);
    }
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId("notifications");
      app.delete(collection);
    } catch (e) {
      if (e.message && e.message.includes("no rows in result set")) {
        return;
      }
      throw e;
    }
  },
);
