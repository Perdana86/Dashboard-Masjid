/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const settings = app.findCollectionByNameOrId("settings");

    if (!settings.fields.getByName("sched_before_prayer")) {
      settings.fields.add(new NumberField({ name: "sched_before_prayer", min: 1, max: 60 }));
    }
    if (!settings.fields.getByName("sched_after_prayer")) {
      settings.fields.add(new NumberField({ name: "sched_after_prayer", min: 1, max: 60 }));
    }
    if (!settings.fields.getByName("sched_interval_hours")) {
      settings.fields.add(new NumberField({ name: "sched_interval_hours", min: 1, max: 24 }));
    }
    if (!settings.fields.getByName("sched_enabled")) {
      settings.fields.add(new BoolField({ name: "sched_enabled" }));
    }
    app.save(settings);

    // backfill defaults
    const rows = app.findRecordsByFilter("settings", "id != ''", "", 100, 0);
    rows.forEach((r) => {
      let changed = false;
      if (!r.get("sched_before_prayer")) { r.set("sched_before_prayer", 5); changed = true; }
      if (!r.get("sched_after_prayer")) { r.set("sched_after_prayer", 10); changed = true; }
      if (!r.get("sched_interval_hours")) { r.set("sched_interval_hours", 1); changed = true; }
      if (r.get("sched_enabled") === null || r.get("sched_enabled") === undefined) {
        r.set("sched_enabled", true); changed = true;
      }
      if (changed) app.save(r);
    });
  },
  (app) => {
    try {
      const settings = app.findCollectionByNameOrId("settings");
      for (const n of ["sched_before_prayer", "sched_after_prayer", "sched_interval_hours", "sched_enabled"]) {
        if (settings.fields.getByName(n)) settings.fields.removeByName(n);
      }
      app.save(settings);
    } catch (_) { /* noop */ }
  },
);
