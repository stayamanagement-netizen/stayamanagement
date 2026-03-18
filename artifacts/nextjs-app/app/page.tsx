"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

async function resolveRoleAndRedirect(userId: string) {
  let role = "guest";
  try {
    const fetchRole = supabase.from("profiles").select("role").eq("id", userId).single()
      .then(r => r.data?.role ?? null);
    const timeout = new Promise<null>(resolve => setTimeout(() => resolve(null), 3000));
    const result = await Promise.race([fetchRole, timeout]);
    if (result) role = result as string;
  } catch { /* default to guest */ }

  if (role === "super_admin")   { window.location.replace("/dashboard/admin");   return; }
  if (role === "villa_owner")   { window.location.replace("/dashboard/owner");   return; }
  if (role === "villa_manager") { window.location.replace("/dashboard/manager"); return; }
  window.location.replace("/dashboard/guest");
}

export default function LoginPage() {

  // Whether initial session check is done (prevents flashing the login form for logged-in users)
  const [sessionChecked, setSessionChecked] = useState(false);

  // Staff login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Guest magic link state
  const [guestEmail, setGuestEmail] = useState("");
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestSent, setGuestSent] = useState(false);
  const [guestError, setGuestError] = useState("");

  // ── Session check: redirect already-logged-in users ─────────────────────────
  useEffect(() => {
    // 5-second hard timeout — always show the login form if something hangs
    const fallback = setTimeout(() => setSessionChecked(true), 5000);

    (async () => {
      try {
        const getUserWithTimeout = Promise.race([
          supabase.auth.getUser(),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000)),
        ]);
        const { data: { user } } = await getUserWithTimeout;
        clearTimeout(fallback);
        if (!user) { setSessionChecked(true); return; }
        // Already logged in — redirect to role-appropriate dashboard
        await resolveRoleAndRedirect(user.id);
      } catch {
        clearTimeout(fallback);
        setSessionChecked(true);
      }
    })();
  }, []);

  // ── Brief loading screen while checking existing session ───────────────────
  if (!sessionChecked) {
    return (
      <>
        <style>{`*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{background:#F5F0E8}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ minHeight:"100vh", background:"#F5F0E8", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ width:36, height:36, border:"3px solid #EDE6D6", borderTop:"3px solid #C9A84C", borderRadius:"50%", animation:"spin .8s linear infinite" }} />
        </div>
      </>
    );
  }

  // ── Staff login ────────────────────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) { setError(authError.message); setLoading(false); return; }
      if (!data.user) { setError("Login failed. Please try again."); setLoading(false); return; }

      // Fetch role from Supabase directly and redirect to the correct dashboard
      await resolveRoleAndRedirect(data.user.id);
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  // ── Guest magic link ────────────────────────────────────────────────────────
  async function handleGuestAccess(e: React.FormEvent) {
    e.preventDefault();
    setGuestError("");
    setGuestLoading(true);

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: guestEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (otpError) {
        setGuestError(otpError.message);
        setGuestLoading(false);
        return;
      }

      setGuestSent(true);
      setGuestLoading(false);
    } catch {
      setGuestError("Something went wrong. Please try again.");
      setGuestLoading(false);
    }
  }

  // ── Normal login form ───────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background-color: #F5F0E8; }

        .login-wrapper {
          min-height: 100vh;
          background-color: #F5F0E8;
          background-image:
            radial-gradient(ellipse at 20% 50%, rgba(201,168,76,0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(201,168,76,0.06) 0%, transparent 40%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .login-container { width: 100%; max-width: 460px; }

        .login-card {
          background: #FFFFFF;
          border-radius: 20px;
          box-shadow:
            0 4px 6px rgba(44,44,44,0.04),
            0 10px 40px rgba(44,44,44,0.10),
            0 0 0 1px rgba(201,168,76,0.12);
          overflow: hidden;
        }

        .card-header {
          padding: 44px 44px 36px;
          text-align: center;
          border-bottom: 1px solid #F0EBE0;
          background: linear-gradient(180deg, #FDFAF5 0%, #FFFFFF 100%);
        }

        .logo-mark {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 52px;
          height: 52px;
          background: linear-gradient(135deg, #C9A84C 0%, #E2C06B 50%, #B8913A 100%);
          border-radius: 14px;
          margin-bottom: 20px;
          box-shadow: 0 4px 12px rgba(201,168,76,0.35);
        }
        .logo-mark svg { width: 26px; height: 26px; color: #fff; }

        .company-name {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 28px; font-weight: 700;
          color: #2C2C2C; letter-spacing: 0.01em; line-height: 1.2;
          margin-bottom: 6px;
        }

        .company-subtitle {
          font-size: 12.5px; font-weight: 400;
          color: #9E8E6A; letter-spacing: 0.12em; text-transform: uppercase;
        }

        .card-body { padding: 36px 44px 40px; }

        .form-group { margin-bottom: 20px; }

        .form-label {
          display: block; font-size: 12px; font-weight: 600;
          color: #6B5C3E; letter-spacing: 0.08em;
          text-transform: uppercase; margin-bottom: 8px;
        }

        .input-wrapper { position: relative; }

        .form-input {
          width: 100%; padding: 13px 16px;
          font-family: 'Inter', sans-serif; font-size: 14.5px;
          color: #2C2C2C; background: #FDFAF5;
          border: 1.5px solid #E8E0D0; border-radius: 10px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          -webkit-appearance: none;
        }
        .form-input::placeholder { color: #C4B89A; font-weight: 300; }
        .form-input:focus {
          border-color: #C9A84C; background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(201,168,76,0.12);
        }

        .password-toggle {
          position: absolute; right: 14px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #C4B89A; display: flex; align-items: center;
          padding: 2px; transition: color 0.2s;
        }
        .password-toggle:hover { color: #9E8E6A; }
        .form-input.has-toggle { padding-right: 44px; }

        .main-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, #E8E0D0, transparent);
          margin: 8px 0 24px;
        }

        .sign-in-btn {
          width: 100%; padding: 14px 20px;
          font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 600;
          color: #FFFFFF;
          background: linear-gradient(135deg, #C9A84C 0%, #D4B55A 40%, #B8913A 100%);
          border: none; border-radius: 10px; cursor: pointer;
          letter-spacing: 0.04em;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 14px rgba(201,168,76,0.40);
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .sign-in-btn:hover:not(:disabled) {
          opacity: 0.92; transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(201,168,76,0.50);
        }
        .sign-in-btn:active:not(:disabled) { transform: translateY(0); opacity: 0.88; }
        .sign-in-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        .error-box {
          display: flex; align-items: flex-start; gap: 10px;
          background: #FFF5F5; border: 1px solid #F5C0C0;
          border-radius: 10px; padding: 13px 16px; margin-bottom: 20px;
          color: #B84040; font-size: 13.5px; line-height: 1.45;
        }
        .error-box svg { flex-shrink: 0; margin-top: 1px; }

        .or-divider {
          display: flex; align-items: center; gap: 14px;
          margin: 28px 0 24px;
        }
        .or-divider-line { flex: 1; height: 1px; background: #EDE6D6; }
        .or-divider-text {
          font-size: 11px; font-weight: 600;
          color: #C4B89A; letter-spacing: 0.12em; text-transform: uppercase;
        }

        .guest-section {
          background: #FDFAF5;
          border: 1px solid #EDE6D6;
          border-radius: 14px;
          padding: 20px 22px 22px;
        }

        .guest-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
        .guest-title { font-size: 13px; font-weight: 600; color: #6B5C3E; }
        .guest-subtitle { font-size: 11.5px; color: #B0A080; margin-bottom: 14px; line-height: 1.4; }

        .guest-input {
          width: 100%; padding: 11px 14px;
          font-family: 'Inter', sans-serif; font-size: 13.5px;
          color: #2C2C2C; background: #FFFFFF;
          border: 1.5px solid #E8E0D0; border-radius: 8px;
          outline: none; margin-bottom: 10px;
          transition: border-color 0.2s, box-shadow 0.2s;
          -webkit-appearance: none;
        }
        .guest-input::placeholder { color: #C4B89A; font-weight: 300; }
        .guest-input:focus { border-color: #C9A84C; box-shadow: 0 0 0 3px rgba(201,168,76,0.10); }

        .guest-btn {
          width: 100%; padding: 11px 16px;
          font-family: 'Inter', sans-serif; font-size: 13.5px; font-weight: 500;
          color: #6B5C3E; background: #FFFFFF;
          border: 1.5px solid #D4C9B0;
          border-radius: 8px; cursor: pointer;
          transition: all 0.15s;
          display: flex; align-items: center; justify-content: center; gap: 7px;
        }
        .guest-btn:hover:not(:disabled) { background: #F5EFE0; border-color: #C9A84C; color: #5A4A2E; }
        .guest-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        .guest-success {
          display: flex; align-items: flex-start; gap: 9px;
          background: #F0FAF4; border: 1px solid #B6DFC5;
          border-radius: 9px; padding: 13px 15px;
          color: #2D7A50; font-size: 13px; line-height: 1.45;
        }

        .guest-error { font-size: 12px; color: #B84040; margin-top: 8px; text-align: center; }

        .spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        .spinner-dark {
          width: 14px; height: 14px;
          border: 2px solid #D4C9B0;
          border-top-color: #6B5C3E;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .footer-text {
          font-size: 11.5px; color: #C4B89A;
          letter-spacing: 0.04em; margin-top: 24px; text-align: center;
        }

        @media (max-width: 520px) {
          .card-header { padding: 36px 28px 28px; }
          .card-body { padding: 28px 28px 32px; }
          .company-name { font-size: 24px; }
        }

        @media (min-width: 768px) { .login-container { max-width: 480px; } }
      `}</style>

      <div className="login-wrapper">
        <div className="login-container">
          <div className="login-card">

            <div className="card-header">
              <div className="logo-mark">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
              </div>
              <h1 className="company-name">Staya Management</h1>
              <p className="company-subtitle">Villa Management Platform</p>
            </div>

            <div className="card-body">

              <form onSubmit={handleLogin}>
                {error && (
                  <div className="error-box">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email Address</label>
                  <div className="input-wrapper">
                    <input
                      id="email" type="email" className="form-input"
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com" required autoComplete="email"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="form-label">Password</label>
                  <div className="input-wrapper">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className="form-input has-toggle"
                      value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password" required autoComplete="current-password"
                    />
                    <button type="button" className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}>
                      {showPassword ? (
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="main-divider" />

                <button type="submit" className="sign-in-btn" disabled={loading}>
                  {loading ? (
                    <><div className="spinner" /> Signing in…</>
                  ) : (
                    <>
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l3 3m0 0l-3 3m3-3H2.25" />
                      </svg>
                      Sign In
                    </>
                  )}
                </button>
              </form>

              <div className="or-divider">
                <div className="or-divider-line" />
                <span className="or-divider-text">or</span>
                <div className="or-divider-line" />
              </div>

              <div className="guest-section">
                <div className="guest-header">
                  <svg width="14" height="14" fill="none" stroke="#9E8E6A" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51l-4.66-2.51m0 0l-1.023-.55a2.25 2.25 0 00-2.134 0l-1.022.55m0 0l-4.661 2.51m16.5 1.615a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V8.844a2.25 2.25 0 011.183-1.98l7.5-4.04a2.25 2.25 0 012.134 0l7.5 4.04a2.25 2.25 0 011.183 1.98V19.5z" />
                  </svg>
                  <span className="guest-title">Guest Access</span>
                </div>
                <p className="guest-subtitle">For guests with an existing booking</p>

                {guestSent ? (
                  <div className="guest-success">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style={{ flexShrink: 0, marginTop: 1 }}>
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    <span>Check your email — we&apos;ve sent you an access link</span>
                  </div>
                ) : (
                  <form onSubmit={handleGuestAccess}>
                    <input
                      type="email"
                      className="guest-input"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      autoComplete="email"
                    />
                    <button type="submit" className="guest-btn" disabled={guestLoading}>
                      {guestLoading ? (
                        <><div className="spinner-dark" /> Sending…</>
                      ) : (
                        <>
                          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                          </svg>
                          Send My Access Link
                        </>
                      )}
                    </button>
                    {guestError && <p className="guest-error">{guestError}</p>}
                  </form>
                )}
              </div>

              <p className="footer-text">© {new Date().getFullYear()} Staya Management · All rights reserved</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
