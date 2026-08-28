/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("settings");

    const addText = (name, max) => {
      if (collection.fields.getByName(name)) return;
      collection.fields.add(
        new TextField({
          name,
          required: false,
          max: max || 60,
        }),
      );
    };

    addText("label_penerimaan", 40);
    addText("label_pengeluaran", 40);
    addText("label_sisa", 40);
    addText("label_kas", 40);

    if (!collection.fields.getByName("saldo_kas")) {
      collection.fields.add(
        new NumberField({
          name: "saldo_kas",
          required: false,
          min: 0,
        }),
      );
    }

    app.save(collection);

    // Backfill default labels on existing settings rows.
    try {
      const rows = app.findRecordsByFilter("settings", 'id != ""', "", 100);
      for (const r of rows) {
        let changed = false;
        if (!r.get("label_penerimaan")) {
          r.set("label_penerimaan", "Penerimaan");
          changed = true;
        }
        if (!r.get("label_pengeluaran")) {
          r.set("label_pengeluaran", "Pengeluaran");
          changed = true;
        }
        if (!r.get("label_sisa")) {
          r.set("label_sisa", "Sisa Saldo Awal");
          changed = true;
        }
        if (!r.get("label_kas")) {
          r.set("label_kas", "Sisa Saldo Akhir");
          changed = true;
        }
        if (
          r.get("saldo_kas") === null ||
          r.get("saldo_kas") === undefined ||
          r.get("saldo_kas") === ""
        ) {
          r.set("saldo_kas", 0);
          changed = true;
        }
        if (changed) app.save(r);
      }
    } catch (e) {
      console.log("saldo label backfill skipped:", e.message);
    }
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId("settings");
      [
        "label_penerimaan",
        "label_pengeluaran",
        "label_sisa",
        "label_kas",
        "saldo_kas",
      ].forEach((name) => {
        collection.fields.removeByName(name);
      });
      app.save(collection);
    } catch (e) {
      if (e.message.includes("no rows in result set")) {
        console.log("Collection not found, skipping revert");
        return;
      }
      throw e;
    }
  },
);
