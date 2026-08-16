/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("settings");
    collection.fields.add(
      new NumberField({
        name: "saldo_sisa",
        min: 0,
      }),
    );
    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("settings");
    collection.fields.removeByName("saldo_sisa");
    app.save(collection);
  },
);
