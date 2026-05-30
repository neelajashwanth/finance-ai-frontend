import React, { useState } from "react";
import axios from "axios";

function LoginPage({ onLogin }) {
  const API_BASE = "http://localhost:8081";

  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    monthlyIncome: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        await axios.post(`${API_BASE}/api/users/register`, {
          name: form.name,
          email: form.email,
          password: form.password,
          monthlyIncome: Number(form.monthlyIncome)
        });
      }

      const res = await axios.post(`${API_BASE}/api/users/login`, {
        email: form.email,
        password: form.password
      });

      localStorage.setItem("financeUser", JSON.stringify(res.data));
      onLogin(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Login or registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.bgGlowOne}></div>
      <div style={styles.bgGlowTwo}></div>

      <div style={styles.wrapper}>
        <div style={styles.leftPanel}>
          <div style={styles.logoRow}>
            <div style={styles.logo}>₹</div>
            <div>
              <div style={styles.brand}>Finance AI</div>
              <div style={styles.brandSub}>Smart personal money assistant</div>
            </div>
          </div>

          <h1 style={styles.heroTitle}>
            Manage money with
            <span style={styles.heroAccent}> AI-powered insights</span>
          </h1>

          <p style={styles.heroText}>
            Track expenses, set savings goals, understand your spending, and chat
            with your personal finance assistant in one place.
          </p>

          <div style={styles.featureList}>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>📊</div>
              <div>
                <div style={styles.featureTitle}>Smart dashboards</div>
                <div style={styles.featureText}>See category trends and spending summaries instantly.</div>
              </div>
            </div>

            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>🤖</div>
              <div>
                <div style={styles.featureTitle}>AI financial assistant</div>
                <div style={styles.featureText}>Ask questions and get personalized money guidance.</div>
              </div>
            </div>

            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>🎯</div>
              <div>
                <div style={styles.featureTitle}>Savings goals</div>
                <div style={styles.featureText}>Track progress and stay focused on your target.</div>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.rightPanel}>
          <div style={styles.card}>
            <div style={styles.cardTop}>
              <div>
                <div style={styles.cardTitle}>{isRegister ? "Create account" : "Welcome back"}</div>
                <div style={styles.cardSubtitle}>
                  {isRegister
                    ? "Start your AI-powered finance journey"
                    : "Login to continue to your dashboard"}
                </div>
              </div>
            </div>

            {isRegister && (
              <>
                <label style={styles.label}>Full Name</label>
                <input
                  name="name"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={handleChange}
                  style={styles.input}
                />

                <label style={styles.label}>Monthly Income</label>
                <input
                  name="monthlyIncome"
                  type="number"
                  placeholder="Enter your monthly income"
                  value={form.monthlyIncome}
                  onChange={handleChange}
                  style={styles.input}
                />
              </>
            )}

            <label style={styles.label}>Email</label>
            <input
              name="email"
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              style={styles.input}
            />

            <label style={styles.label}>Password</label>
            <input
              name="password"
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              style={styles.input}
            />

            {error && <div style={styles.errorBox}>{error}</div>}

            <button onClick={handleSubmit} style={styles.button} disabled={loading}>
              {loading
                ? isRegister
                  ? "Creating account..."
                  : "Logging in..."
                : isRegister
                ? "Register & Login"
                : "Login"}
            </button>

            <div style={styles.switchRow}>
              <span style={styles.switchText}>
                {isRegister ? "Already have an account?" : "New here?"}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError("");
                }}
                style={styles.linkButton}
              >
                {isRegister ? "Login" : "Create account"}
              </button>
            </div>

            <div style={styles.footerNote}>
              Secure access to your personal finance dashboard
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f172a 0%, #111827 45%, #1d4ed8 100%)",
    position: "relative",
    overflow: "hidden",
    fontFamily: "Inter, Arial, sans-serif",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px"
  },
  bgGlowOne: {
    position: "absolute",
    width: "420px",
    height: "420px",
    borderRadius: "50%",
    background: "rgba(59, 130, 246, 0.25)",
    filter: "blur(90px)",
    top: "-80px",
    left: "-80px"
  },
  bgGlowTwo: {
    position: "absolute",
    width: "420px",
    height: "420px",
    borderRadius: "50%",
    background: "rgba(139, 92, 246, 0.22)",
    filter: "blur(90px)",
    bottom: "-100px",
    right: "-80px"
  },
  wrapper: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    maxWidth: "1220px",
    display: "grid",
    gridTemplateColumns: "1.1fr 0.9fr",
    gap: "28px",
    alignItems: "stretch"
  },
  leftPanel: {
    color: "#fff",
    padding: "28px 16px 28px 8px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center"
  },
  rightPanel: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "24px"
  },
  logo: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    display: "grid",
    placeItems: "center",
    fontSize: "24px",
    fontWeight: "800",
    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    boxShadow: "0 8px 24px rgba(59,130,246,0.35)"
  },
  brand: {
    fontSize: "22px",
    fontWeight: "800"
  },
  brandSub: {
    color: "rgba(255,255,255,0.72)",
    fontSize: "14px",
    marginTop: "4px"
  },
  heroTitle: {
    fontSize: "52px",
    lineHeight: 1.08,
    margin: "0 0 18px 0",
    fontWeight: "800",
    maxWidth: "620px"
  },
  heroAccent: {
    display: "block",
    color: "#bfdbfe"
  },
  heroText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: "18px",
    lineHeight: 1.7,
    maxWidth: "620px",
    marginBottom: "28px"
  },
  featureList: {
    display: "grid",
    gap: "14px",
    maxWidth: "620px"
  },
  featureCard: {
    display: "flex",
    gap: "14px",
    alignItems: "flex-start",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    padding: "16px",
    borderRadius: "18px",
    backdropFilter: "blur(8px)"
  },
  featureIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "14px",
    background: "rgba(255,255,255,0.12)",
    display: "grid",
    placeItems: "center",
    fontSize: "20px",
    flexShrink: 0
  },
  featureTitle: {
    fontWeight: "700",
    fontSize: "16px",
    marginBottom: "6px"
  },
  featureText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: "14px",
    lineHeight: 1.5
  },
  card: {
    width: "100%",
    maxWidth: "460px",
    background: "rgba(255,255,255,0.92)",
    border: "1px solid rgba(255,255,255,0.35)",
    backdropFilter: "blur(18px)",
    borderRadius: "28px",
    padding: "34px",
    boxShadow: "0 24px 60px rgba(15,23,42,0.28)"
  },
  cardTop: {
    marginBottom: "22px"
  },
  cardTitle: {
    fontSize: "34px",
    fontWeight: "800",
    color: "#111827",
    marginBottom: "8px"
  },
  cardSubtitle: {
    color: "#6b7280",
    fontSize: "15px"
  },
  label: {
    display: "block",
    marginBottom: "8px",
    marginTop: "14px",
    fontWeight: "600",
    color: "#374151",
    fontSize: "14px"
  },
  input: {
    width: "100%",
    padding: "16px 18px",
    borderRadius: "16px",
    border: "1px solid #d1d5db",
    background: "#fff",
    fontSize: "16px",
    outline: "none",
    boxSizing: "border-box",
    transition: "0.2s ease"
  },
  errorBox: {
    marginTop: "16px",
    background: "#fef2f2",
    color: "#dc2626",
    border: "1px solid #fecaca",
    borderRadius: "14px",
    padding: "12px 14px",
    fontSize: "14px",
    lineHeight: 1.5
  },
  button: {
    width: "100%",
    marginTop: "22px",
    padding: "16px",
    border: "none",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #2563eb, #7c3aed)",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(37,99,235,0.28)"
  },
  switchRow: {
    marginTop: "18px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap"
  },
  switchText: {
    color: "#6b7280",
    fontSize: "14px"
  },
  linkButton: {
    background: "none",
    border: "none",
    color: "#2563eb",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "14px"
  },
  footerNote: {
    marginTop: "22px",
    textAlign: "center",
    color: "#9ca3af",
    fontSize: "13px"
  }
};

export default LoginPage;