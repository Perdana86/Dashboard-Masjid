-- ============================================================================
--  Supabase schema for the Mosque Dashboard
--  One-way sync target for PocketBase (see pb_hooks/supabase_sync.pb.js).
--
--  Run this in: Supabase Dashboard -> SQL Editor -> New query -> Run.
--  Safe to re-run (idempotent): uses CREATE TABLE IF NOT EXISTS and
--  DROP/CREATE for policies.
--
--  Tables mirror the PocketBase collections:
--    settings          (holds saldo_jumat, jadwal_slide, tema_warna, pwa_settings)
--    slides            (Layar Informasi)
--    dashboard_slides  (Dashboard)
--    bio               (mosque profile)
--    bio_links         (profile link buttons)
--    activities        (kegiatan)
--    notifications     (prayer/iqomah notification log)
--
--  Row Level Security:
--    - anon role can SELECT (public read) — the dashboard reads via anon key.
--    - INSERT/UPDATE/DELETE are NOT granted to anon; only the service-role
--      key (used by the sync hook) can write, and it bypasses RLS entirely.
-- ============================================================================

-- Auto-update updated_at on every row change.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------- settings --------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
    id                   text PRIMARY KEY,
    mosque_name          text,
    tagline              text,
    address              text,
    logo                 text,            -- PocketBase file URL (synced)
    running_text         text,
    quote                text,
    quote_source         text,
    city_id              text,
    city_name            text,
    accent               text,
    slide_seconds        integer,
    theme_bg             text,
    theme_surface        text,
    theme_primary        text,
    theme_text           text,
    theme_iqomah         text,
    sched_before_prayer  integer,
    sched_after_prayer   integer,
    sched_interval_hours integer,
    sched_enabled        boolean,
    saldo_pemasukan      numeric,
    saldo_pengeluaran    numeric,
    saldo_sisa           numeric,
    saldo_kas            numeric,
    saldo_visible        boolean,
    saldo_label          text,
    label_penerimaan     text,
    label_pengeluaran    text,
    label_sisa           text,
    label_kas            text,
    favicon              text,
    pwa_app_name         text,
    pwa_short_name       text,
    pwa_description      text,
    pwa_theme_color      text,
    pwa_bg_color         text,
    pwa_logo             text,
    created              timestamptz DEFAULT now(),
    updated              timestamptz DEFAULT now()
);
DROP TRIGGER IF EXISTS settings_set_updated_at ON settings;
CREATE TRIGGER settings_set_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------- slides (Layar Informasi) ----------------------------------------
CREATE TABLE IF NOT EXISTS slides (
    id                text PRIMARY KEY,
    title             text,
    caption           text,
    image             text,           -- PocketBase file URL (synced)
    image_url         text,
    position          integer,
    active            boolean,
    media_type        text,
    slide_type        text,
    text_content      text,
    text_translation  text,
    text_font_size    text,
    text_color        text,
    text_bg           text,
    text_align        text,
    video             text,           -- PocketBase file URL (synced)
    video_url         text,
    website_url       text,
    youtube_url       text,
    created           timestamptz DEFAULT now(),
    updated           timestamptz DEFAULT now()
);
DROP TRIGGER IF EXISTS slides_set_updated_at ON slides;
CREATE TRIGGER slides_set_updated_at BEFORE UPDATE ON slides
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------- dashboard_slides ------------------------------------------------
CREATE TABLE IF NOT EXISTS dashboard_slides (
    id                text PRIMARY KEY,
    title             text,
    caption           text,
    image             text,
    image_url         text,
    position          integer,
    active            boolean,
    media_type        text,
    slide_type        text,
    text_content      text,
    text_translation  text,
    text_font_size    text,
    text_color        text,
    text_bg           text,
    text_align        text,
    video             text,
    video_url         text,
    website_url       text,
    youtube_url       text,
    created           timestamptz DEFAULT now(),
    updated           timestamptz DEFAULT now()
);
DROP TRIGGER IF EXISTS dashboard_slides_set_updated_at ON dashboard_slides;
CREATE TRIGGER dashboard_slides_set_updated_at BEFORE UPDATE ON dashboard_slides
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------- bio -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bio (
    id               text PRIMARY KEY,
    mosque_name      text,
    description      text,
    address          text,
    phone            text,
    email            text,
    operating_hours  text,
    photo            text,
    long_description text,
    created          timestamptz DEFAULT now(),
    updated          timestamptz DEFAULT now()
);
DROP TRIGGER IF EXISTS bio_set_updated_at ON bio;
CREATE TRIGGER bio_set_updated_at BEFORE UPDATE ON bio
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------- bio_links -------------------------------------------------------
CREATE TABLE IF NOT EXISTS bio_links (
    id        text PRIMARY KEY,
    label     text,
    url       text,
    icon      text,
    position  integer,
    active    boolean,
    created   timestamptz DEFAULT now(),
    updated   timestamptz DEFAULT now()
);
DROP TRIGGER IF EXISTS bio_links_set_updated_at ON bio_links;
CREATE TRIGGER bio_links_set_updated_at BEFORE UPDATE ON bio_links
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------- activities ------------------------------------------------------
CREATE TABLE IF NOT EXISTS activities (
    id            text PRIMARY KEY,
    title         text,
    description   text,
    image         text,
    video_local   text,
    video_youtube text,
    position      integer,
    active        boolean,
    created       timestamptz DEFAULT now(),
    updated       timestamptz DEFAULT now()
);
DROP TRIGGER IF EXISTS activities_set_updated_at ON activities;
CREATE TRIGGER activities_set_updated_at BEFORE UPDATE ON activities
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------- notifications ---------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id                text PRIMARY KEY,
    prayer_key        text,
    prayer_label      text,
    notification_type text,
    scheduled_time    text,
    triggered_at      text,
    source            text,
    created           timestamptz DEFAULT now(),
    updated           timestamptz DEFAULT now()
);
DROP TRIGGER IF EXISTS notifications_set_updated_at ON notifications;
CREATE TRIGGER notifications_set_updated_at BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------- Row Level Security ---------------------------------------------
-- Public read for the anon role (the dashboard uses the anon key). Writes are
-- performed only by the service-role key, which bypasses RLS, so no
-- INSERT/UPDATE/DELETE policies are granted to anon.
ALTER TABLE settings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE slides            ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_slides  ENABLE ROW LEVEL SECURITY;
ALTER TABLE bio               ENABLE ROW LEVEL SECURITY;
ALTER TABLE bio_links         ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities        ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications     ENABLE ROW LEVEL SECURITY;

-- (Re)create the anon SELECT policy on every table.
DO $$
DECLARE t text;
BEGIN
    FOREACH t IN ARRAY ARRAY['settings','slides','dashboard_slides','bio','bio_links','activities','notifications'] LOOP
        EXECUTE format('DROP POLICY IF EXISTS anon_select ON %I;', t);
        EXECUTE format('CREATE POLICY anon_select ON %I FOR SELECT TO anon USING (true);', t);
    END LOOP;
END $$;

-- ---------- Realtime --------------------------------------------------------
-- Enable realtime broadcast for every table so the dashboard's Supabase
-- subscriptions (lib/supabaseDb.js -> subscribeSupabase) receive changes.
DO $$
DECLARE t text;
BEGIN
    FOREACH t IN ARRAY ARRAY['settings','slides','dashboard_slides','bio','bio_links','activities','notifications'] LOOP
        BEGIN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I;', t);
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
    END LOOP;
END $$;
