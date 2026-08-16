/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("settings");
    ["saldo_pemasukan", "saldo_pengeluaran", "saldo_sisa", "saldo_kas"].forEach((name) => {
      const field = collection.fields.getByName(name);
      if (field) {
        field.min = null;
      }
    });
    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("settings");
    ["saldo_pemasukan", "saldo_pengeluaran", "saldo_sisa", "saldo_kas"].forEach((name) => {
      const field = collection.fields.getByName(name);
      if (field) {
        field.min = 0;
      }
    });
    app.save(collection);
  },
);
