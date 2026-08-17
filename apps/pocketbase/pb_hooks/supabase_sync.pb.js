/// <reference path="../pb_data/types.d.ts" />

/**
 * One-way sync: PocketBase -> Supabase.
 *
 * Fires on every record create/update/delete for the public collections and
 * upserts (or deletes) the matching row in Supabase via the PostgREST API,
 * using the service-role key (bypasses RLS). The browser only ever uses the
 * anon key; the service-role key lives server-side only.
 *
 * Graceful no-op when Supabase is not configured yet: if
 * `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` are unset, the hook logs a
 * single debug line and returns without throwing — so the app keeps working
 * on PocketBase alone until the user supplies credentials (see
 * SUPABASE_SETUP.md).
 *
 * Required env (set on the PocketBase process):
 *   SUPABASE_URL               e.g. https://abcdefgh.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY  project service-role key (secret!)
 * Optional:
 *   POCKETBASE_PUBLIC_URL      origin for absolute file URLs; when unset the
 *                              stored URL is the in-app proxy path /pb/api/files/...
 *                              which resolves correctly when the dashboard loads
 *                              the image.
 */

// collection -> { table, fields, fileFields }
// `settings` holds saldo_jumat, jadwal_slide, tema_warna, and pwa_settings as
// field groups, so syncing the single settings row covers all of them.
const SYNC_MAP = {
  settings: {
    table: "settings",
    fields: [
      "mosque_name",
      "tagline",
      "address",
      "running_text",
      "quote",
      "quote_source",
      "city_id",
      "city_name",
      "accent",
      "slide_seconds",
      "theme_bg",
      "theme_surface",
      "theme_primary",
      "theme_text",
      "theme_iqomah",
      "sched_before_prayer",
      "sched_after_prayer",
      "sched_interval_hours",
      "sched_enabled",
      "saldo_pemasukan",
      "saldo_pengeluaran",
      "saldo_sisa",
      "saldo_kas",
      "saldo_visible",
      "saldo_label",
      "label_penerimaan",
      "label_pengeluaran",
      "label_sisa",
      "label_kas",
      "pwa_app_name",
      "pwa_short_name",
      "pwa_description",
      "pwa_theme_color",
      "pwa_bg_color",
    ],
    fileFields: ["logo", "favicon", "pwa_logo"],
  },
  slides: {
    table: "slides",
    fields: [
      "title",
      "caption",
      "image_url",
      "position",
      "active",
      "media_type",
      "slide_type",
      "text_content",
      "text_translation",
      "text_font_size",
      "text_color",
      "text_bg",
      "text_align",
      "video_url",
      "website_url",
      "youtube_url",
    ],
    fileFields: ["image", "video"],
  },
  dashboard_slides: {
    table: "dashboard_slides",
    fields: [
      "title",
      "caption",
      "image_url",
      "position",
      "active",
      "media_type",
      "slide_type",
      "text_content",
      "text_translation",
      "text_font_size",
      "text_color",
      "text_bg",
      "text_align",
      "video_url",
      "website_url",
      "youtube_url",
    ],
    fileFields: ["image", "video"],
  },
  bio: {
    table: "bio",
    fields: [
      "mosque_name",
      "description",
      "address",
      "phone",
      "email",
      "operating_hours",
      "long_description",
    ],
    fileFields: ["photo"],
  },
  bio_links: {
    table: "bio_links",
    fields: ["label", "url", "position", "active"],
    fileFields: ["icon"],
  },
  activities: {
    table: "activities",
    fields: ["title", "description", "video_youtube", "position", "active"],
    fileFields: ["image", "video_local"],
  },
  notifications: {
    table: "notifications",
    fields: [
      "prayer_key",
      "prayer_label",
      "notification_type",
      "scheduled_time",
      "triggered_at",
      "source",
    ],
    fileFields: [],
  },
};

function supabaseConfig() {
  const url = $os.getenv("SUPABASE_URL") || "";
  const key = $os.getenv("SUPABASE_SERVICE_ROLE_KEY") || "";
  return { url: url.replace(/\/+$/, ""), key };
}

function fileBaseUrl() {
  const publicUrl = $os.getenv("POCKETBASE_PUBLIC_URL") || "";
  if (publicUrl) return publicUrl.replace(/\/+$/, "");
  // In-app proxy path — resolves correctly when the dashboard loads the
  // image from the same origin. Use /pb for production Nginx proxy.
  return "/pb";
}

function buildFileUrl(collectionName, recordId, filename) {
  if (!filename) return null;
  const base = fileBaseUrl();
  return (
    base + "/api/files/" + collectionName + "/" + recordId + "/" + filename
  );
}

function resolveFileField(record, fieldName, collectionName) {
  const raw = record.get(fieldName);
  if (!raw) return null;
  const id = record.id;
  if (Array.isArray(raw)) {
    return raw.map((f) => buildFileUrl(collectionName, id, f)).filter(Boolean);
  }
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    // Already a URL (e.g. seeded image_url) — pass through.
    if (/^(https?:)?\/\//.test(trimmed) || trimmed.indexOf("/api/files/") === 0)
      return trimmed;
    return buildFileUrl(collectionName, id, trimmed);
  }
  return null;
}

function buildPayload(record, cfg, collectionName) {
  const payload = { id: record.id };
  for (const name of cfg.fields) {
    payload[name] = record.get(name);
  }
  for (const name of cfg.fileFields) {
    payload[name] = resolveFileField(record, name, collectionName);
  }
  return payload;
}

function supabaseUpsert(cfg, payload) {
  const { url, key } = supabaseConfig();
  if (!url || !key) return;
  $http.send({
    url: url + "/rest/v1/" + cfg.table,
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: "Bearer " + key,
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
  });
}

function supabaseDelete(cfg, recordId) {
  const { url, key } = supabaseConfig();
  if (!url || !key) return;
  $http.send({
    url:
      url + "/rest/v1/" + cfg.table + "?id=eq." + encodeURIComponent(recordId),
    method: "DELETE",
    headers: {
      apikey: key,
      Authorization: "Bearer " + key,
      Prefer: "return=minimal",
    },
  });
}

function syncUpsert(e, collectionName) {
  const cfg = SYNC_MAP[collectionName];
  if (!cfg) return;
  const { url, key } = supabaseConfig();
  if (!url || !key) {
    // Not configured yet — expected during setup, never throw.
    return;
  }
  try {
    supabaseUpsert(cfg, buildPayload(e.record, cfg, collectionName));
  } catch (err) {
    $app
      .logger()
      .error(
        "supabase sync upsert failed",
        "collection",
        collectionName,
        "err",
        String(err),
      );
  }
  e.next();
}

function syncDelete(e, collectionName) {
  const cfg = SYNC_MAP[collectionName];
  if (!cfg) return;
  const { url, key } = supabaseConfig();
  if (!url || !key) return;
  try {
    supabaseDelete(cfg, e.record.id);
  } catch (err) {
    $app
      .logger()
      .error(
        "supabase sync delete failed",
        "collection",
        collectionName,
        "err",
        String(err),
      );
  }
  e.next();
}

// Register hooks for every synced collection — but only if the collection exists.
// This prevents errors during initial setup when collections haven't been created yet.
for (const collectionName of Object.keys(SYNC_MAP)) {
  try {
    const collection = $app.dao().findCollectionByNameOrId(collectionName);
    if (!collection) {
      $app
        .logger()
        .debug(
          "Supabase sync: collection",
          collectionName,
          "not found, skipping",
        );
      continue;
    }
    onRecordAfterCreateSuccess(
      (e) => syncUpsert(e, collectionName),
      collectionName,
    );
    onRecordAfterUpdateSuccess(
      (e) => syncUpsert(e, collectionName),
      collectionName,
    );
    onRecordAfterDeleteSuccess(
      (e) => syncDelete(e, collectionName),
      collectionName,
    );
  } catch (err) {
    $app
      .logger()
      .debug(
        "Supabase sync: collection",
        collectionName,
        "not found, skipping",
      );
    // Collection doesn't exist yet, skip registration
  }
}
