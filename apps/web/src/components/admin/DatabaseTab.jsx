import React, { useEffect, useState } from 'react';
import { Database, Loader2, RefreshCw, CheckCircle2, AlertTriangle, ArrowLeftRight } from 'lucide-react';
import { getDbSource, setDbSource, DB_POCKETBASE, DB_SUPABASE } from '@/lib/dbSource';
import { supabaseConfigured } from '@/lib/supabaseClient';

const labelClass = 'text-xs uppercase tracking-[0.2em] text-emerald-100/60';

/**
 * Admin tab: choose which database the public dashboard reads from.
 *
 * - PocketBase (default, source of truth) — admin always writes here.
 * - Supabase — one-way synced from PocketBase via pb_hooks/supabase_sync.pb.js.
 *
 * The choice is stored in localStorage (masjid_db_source) and a full page
 * reload is triggered on switch so all realtime subscriptions re-initialize
 * against the newly selected source.
 */
const DatabaseTab = () => {
    const [source, setSource] = useState(getDbSource());
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null); // { ok, message }
    const [switching, setSwitching] = useState(false);

    useEffect(() => {
        setSource(getDbSource());
    }, []);

    const runTest = async () => {
        if (!supabaseConfigured) {
            setTestResult({ ok: false, message: 'Supabase belum dikonfigurasi — isi VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY (lihat SUPABASE_SETUP.md).' });
            return;
        }
        setTesting(true);
        setTestResult(null);
        try {
            const url = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
            const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
            const res = await fetch(`${url}/rest/v1/settings?select=id&limit=1`, {
                headers: { apikey: key, Authorization: `Bearer ${key}` },
            });
            if (res.ok) {
                const data = await res.json();
                setTestResult({ ok: true, message: `Koneksi Supabase berhasil. settings berisi ${Array.isArray(data) ? data.length : 0} baris.` });
            } else {
                setTestResult({ ok: false, message: `Supabase merespons HTTP ${res.status}. Periksa anon key & RLS policy anon_select.` });
            }
        } catch (err) {
            setTestResult({ ok: false, message: `Gagal terhubung ke Supabase: ${err.message}` });
        } finally {
            setTesting(false);
        }
    };

    const switchTo = (next) => {
        if (next === source) return;
        if (next === DB_SUPABASE && !supabaseConfigured) {
            setTestResult({ ok: false, message: 'Tidak bisa beralih ke Supabase: env VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY belum diisi.' });
            return;
        }
        setSwitching(true);
        setDbSource(next);
        // Reload so every hook/page re-subscribes to the new source.
        setTimeout(() => {
            window.location.reload();
        }, 250);
    };

    return (
        <div className="max-w-3xl space-y-7">
            <div>
                <h2 className="font-display text-xl text-white">Sumber Database</h2>
                <p className="mt-1 text-sm text-emerald-100/55">
                    Pilih database yang dibaca halaman publik (dashboard, informasi, bio, kegiatan). Panel admin selalu menulis ke PocketBase; perubahan disinkronkan satu arah ke Supabase.
                </p>
            </div>

            {/* Current source cards */}
            <div className="grid gap-4 sm:grid-cols-2">
                <button
                    type="button"
                    onClick={() => switchTo(DB_POCKETBASE)}
                    className={`flex flex-col gap-3 border p-5 text-left transition-colors ${
                        source === DB_POCKETBASE
                            ? 'border-[var(--m-primary)] bg-[color-mix(in_srgb,var(--m-primary)_10%,transparent)]'
                            : 'border-white/10 bg-white/[0.03] hover:border-white/25'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm font-semibold text-white">
                            <Database className="h-4 w-4 text-[var(--m-primary)]" strokeWidth={2} /> PocketBase
                        </span>
                        {source === DB_POCKETBASE ? (
                            <CheckCircle2 className="h-5 w-5 text-[var(--m-primary)]" strokeWidth={2} />
                        ) : null}
                    </div>
                    <p className="text-xs text-emerald-100/55">Sumber kebenaran default. Admin menulis ke sini. Tidak perlu konfigurasi tambahan.</p>
                </button>

                <button
                    type="button"
                    onClick={() => switchTo(DB_SUPABASE)}
                    className={`flex flex-col gap-3 border p-5 text-left transition-colors ${
                        source === DB_SUPABASE
                            ? 'border-[var(--m-primary)] bg-[color-mix(in_srgb,var(--m-primary)_10%,transparent)]'
                            : 'border-white/10 bg-white/[0.03] hover:border-white/25'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm font-semibold text-white">
                            <Database className="h-4 w-4 text-[var(--m-primary)]" strokeWidth={2} /> Supabase
                        </span>
                        {source === DB_SUPABASE ? (
                            <CheckCircle2 className="h-5 w-5 text-[var(--m-primary)]" strokeWidth={2} />
                        ) : null}
                    </div>
                    <p className="text-xs text-emerald-100/55">
                        {supabaseConfigured ? 'Terkonfigurasi. Data disinkronkan dari PocketBase.' : 'Belum dikonfigurasi — lihat SUPABASE_SETUP.md.'}
                    </p>
                </button>
            </div>

            {/* Status row */}
            <div className="flex flex-wrap items-center gap-3 border border-white/10 bg-white/[0.03] p-4 text-sm">
                <span className={labelClass}>Status</span>
                <span className="text-emerald-50/90">
                    Aktif: <strong className="text-[var(--m-primary)]">{source === DB_SUPABASE ? 'Supabase' : 'PocketBase'}</strong>
                </span>
                <span className="text-emerald-100/40">·</span>
                <span className="text-emerald-50/90">
                    Supabase client: <strong className={supabaseConfigured ? 'text-emerald-300' : 'text-amber-300'}>{supabaseConfigured ? 'siap' : 'belum diisi'}</strong>
                </span>
                {switching ? (
                    <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-emerald-100/70">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Memuat ulang…
                    </span>
                ) : null}
            </div>

            {/* Connection test */}
            <div className="space-y-3 border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className={labelClass}>Tes Koneksi Supabase</p>
                        <p className="mt-1 text-xs text-emerald-100/50">Memeriksa URL + anon key + policy baca (anon_select) pada tabel settings.</p>
                    </div>
                    <button
                        type="button"
                        onClick={runTest}
                        disabled={testing}
                        className="inline-flex items-center gap-2 border border-[color-mix(in_srgb,var(--m-primary)_60%,transparent)] px-4 py-2 text-sm text-[var(--m-primary)] transition-colors hover:bg-[color-mix(in_srgb,var(--m-primary)_10%,transparent)] disabled:opacity-60"
                    >
                        {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" strokeWidth={2} />} Jalankan Tes
                    </button>
                </div>
                {testResult ? (
                    <div
                        className={`flex items-start gap-2 border px-4 py-3 text-sm ${
                            testResult.ok
                                ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                                : 'border-amber-400/30 bg-amber-400/10 text-amber-100'
                        }`}
                    >
                        {testResult.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />}
                        <span>{testResult.message}</span>
                    </div>
                ) : null}
            </div>

            {/* Sync info */}
            <div className="space-y-2 border-l-2 border-[var(--m-primary)] bg-white/[0.02] p-5 text-sm text-emerald-50/80">
                <p className="flex items-center gap-2 font-medium text-white">
                    <ArrowLeftRight className="h-4 w-4 text-[var(--m-primary)]" strokeWidth={2} /> Sinkronisasi satu arah (PocketBase → Supabase)
                </p>
                <p className="text-emerald-100/65">
                    Setiap perubahan di PocketBase (create/update/delete) untuk koleksi <code className="text-[var(--m-primary)]">settings, slides, dashboard_slides, bio, bio_links, activities, notifications</code> otomatis dikirim ke Supabase oleh hook <code className="text-[var(--m-primary)]">supabase_sync.pb.js</code> menggunakan service-role key.
                </p>
                <p className="text-emerald-100/45 text-xs">
                    Sinkronisasi aktif ketika env <code>SUPABASE_URL</code> & <code>SUPABASE_SERVICE_ROLE_KEY</code> terisi di sisi PocketBase. Lihat SUPABASE_SETUP.md.
                </p>
            </div>
        </div>
    );
};

export default DatabaseTab;
