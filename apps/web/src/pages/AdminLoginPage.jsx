import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { Navigate, useNavigate } from "react-router-dom";
import { Loader2, LockKeyhole, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const AdminLoginPage = () => {
  const { login, isAuthed } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (isAuthed) return <Navigate to="/admin" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(
        err && err.status === 400
          ? "Email atau kata sandi salah."
          : "Gagal masuk. Coba lagi.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="masjid-pattern flex min-h-[100dvh] items-center justify-center bg-[var(--m-bg)] px-6 py-16 text-emerald-50">
      <Helmet>
        <title>Login Admin | Pengurus Masjid</title>
        <meta
          name="description"
          content="Halaman masuk pengurus masjid untuk mengelola jadwal, slide informasi, dan running teks dashboard."
        />
      </Helmet>

      <div className="w-full max-w-md border border-white/10 bg-[color-mix(in_srgb,var(--m-bg)_80%,transparent)] p-8 backdrop-blur">
        <div className="mb-7 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--m-primary)_50%,transparent)] text-[var(--m-primary)]">
            <LockKeyhole className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div>
            <h1 className="font-display text-2xl text-white">
              Panel Admin Pengurus Masjid
            </h1>
            <p className="text-sm text-emerald-100/60">
              Khusus pengurus masjid.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="email"
              className="text-xs uppercase tracking-[0.2em] text-emerald-100/60"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-white/15 bg-white/[0.04] px-4 py-3 text-white outline-none transition-colors placeholder:text-emerald-100/30 focus:border-[var(--m-primary)]"
              placeholder="pengurus@masjid.id"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="password"
              className="text-xs uppercase tracking-[0.2em] text-emerald-100/60"
            >
              Kata Sandi
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-white/15 bg-white/[0.04] px-4 py-3 pr-12 text-white outline-none transition-colors placeholder:text-emerald-100/30 focus:border-[var(--m-primary)]"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-100/60 transition-colors hover:text-emerald-100 focus:outline-none"
                title={
                  showPassword ? "Sembunyikan password" : "Tampilkan password"
                }
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" strokeWidth={1.75} />
                ) : (
                  <Eye className="h-5 w-5" strokeWidth={1.75} />
                )}
              </button>
            </div>
          </div>

          {error ? <p className="text-sm text-red-300">{error}</p> : null}

          <button
            type="submit"
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 bg-[var(--m-primary)] px-5 py-3 font-semibold text-[var(--m-surface)] transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {busy ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage;
