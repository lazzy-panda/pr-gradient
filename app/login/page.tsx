"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, HttpError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post("/api/auth/login", { password });
      router.push("/");
      router.refresh();
    } catch (err) {
      if (err instanceof HttpError && err.status === 401) {
        setError("Неверный пароль");
      } else {
        setError("Ошибка входа");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <form
        onSubmit={submit}
        style={{
          width: 360,
          background: "var(--color-surface)",
          padding: 28,
          borderRadius: 14,
          boxShadow: "var(--sh-2)",
          border: "1px solid var(--color-line-1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background:
                "conic-gradient(from 0deg, #B91C5C, #EA580C, #059669, #0891B2, #1D4ED8, #7C3AED, #EC4899, #B91C5C)",
              boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.55)",
            }}
          />
          <span style={{ fontSize: 18, fontWeight: 700 }}>PR Gradient</span>
        </div>
        <div style={{ marginBottom: 14, color: "var(--color-ink-3)", fontSize: 13 }}>
          Внутренний инструмент. Введите общий пароль.
        </div>
        <input
          type="password"
          autoFocus
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль"
          style={{
            width: "100%",
            padding: "10px 12px",
            border: "1px solid var(--color-line-1)",
            borderRadius: 8,
            outline: "none",
            marginBottom: error ? 6 : 14,
          }}
        />
        {error && (
          <div style={{ color: "var(--color-conflict)", fontSize: 12, marginBottom: 14 }}>
            {error}
          </div>
        )}
        <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
          {loading ? "..." : "Войти"}
        </button>
      </form>
    </div>
  );
}
