/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("settings");

    collection.fields.add(
      new NumberField({
        name: "saldo_pemasukan",
        required: false,
        min: 0,
      }),
    );
    collection.fields.add(
      new NumberField({
        name: "saldo_pengeluaran",
        required: false,
        min: 0,
      }),
    );
    collection.fields.add(
      new BoolField({
        name: "saldo_visible",
        required: false,
      }),
    );
    collection.fields.add(
      new TextField({
        name: "saldo_label",
        required: false,
        max: 120,
      }),
    );

    app.save(collection);

    try {
      const rows = app.findRecordsByFilter(
        "settings",
        "id != ''",
        "created",
        10,
        0,
      );
      rows.forEach((r) => {
        if (r.get("saldo_pemasukan") == null) r.set("saldo_pemasukan", 0);
        if (r.get("saldo_pengeluaran") == null) r.set("saldo_pengeluaran", 0);
        if (r.get("saldo_visible") == null) r.set("saldo_visible", true);
        if (!r.get("saldo_label")) r.set("saldo_label", "Informasi Saldo");
        app.save(r);
      });
    } catch (_) {
      // no settings rows yet
    }
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("settings");
    [
      "saldo_pemasukan",
      "saldo_pengeluaran",
      "saldo_visible",
      "saldo_label",
    ].forEach((name) => {
      try {
        collection.fields.removeByName(name);
      } catch (_) {}
    });
    app.save(collection);
  },
);
