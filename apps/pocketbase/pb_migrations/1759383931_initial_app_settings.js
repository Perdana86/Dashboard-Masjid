/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  let settings = app.settings();

  settings.meta.appName = "Masjid Dashboard";
  settings.meta.appURL = ""; // Empty for production - will be set via environment variable
  settings.meta.hideControls = true;

  settings.logs.maxDays = 7;
  settings.logs.minLevel = 8;
  settings.logs.logIP = true;

  settings.trustedProxy.headers = [
    "X-Real-IP",
    "X-Forwarded-For",
    "CF-Connecting-IP",
  ];

  app.save(settings);
});
