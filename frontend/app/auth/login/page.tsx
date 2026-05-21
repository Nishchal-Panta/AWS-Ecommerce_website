"use client";
import { useState, useEffect } from "react";
import { signIn, signUp, confirmSignUp } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import { configureAmplify } from "@/lib/amplify";
import { api } from "@/lib/api";

type Mode = "login" | "register" | "confirm";

export default function LoginPage() {
  const [mode, setMode]           = useState<Mode>("login");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [code, setCode]           = useState("");
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const router = useRouter();

  useEffect(() => { configureAmplify(); }, []);

  async function handleLogin() {
    setLoading(true); setError("");
    try {
      await signIn({ username: email, password });
      await api.post("/auth/sync", {});
      router.push("/products/");
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleRegister() {
    setLoading(true); setError("");
    try {
      await signUp({ username: email, password, options: { userAttributes: { email, given_name: firstName, family_name: lastName } } });
      setMode("confirm");
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleConfirm() {
    setLoading(true); setError("");
    try {
      await confirmSignUp({ username: email, confirmationCode: code });
      await signIn({ username: email, password });
      await api.post("/auth/sync", {});
      router.push("/products/");
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-sm border p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          {mode === "login" ? "Sign in" : mode === "register" ? "Create account" : "Verify email"}
        </h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          {mode === "confirm" ? `We sent a code to ${email}` : "ShopAWS"}
        </p>
        <div className="space-y-4">
          {mode === "confirm" ? (
            <>
              <input value={code} onChange={e => setCode(e.target.value)} placeholder="Verification code"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <button onClick={handleConfirm} disabled={loading}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition text-sm">
                {loading ? "Verifying..." : "Verify & Sign in"}
              </button>
            </>
          ) : (
            <>
              {mode === "register" && (
                <div className="grid grid-cols-2 gap-3">
                  <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              )}
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <button onClick={mode === "login" ? handleLogin : handleRegister} disabled={loading}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition text-sm">
                {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
              </button>
            </>
          )}
        </div>
        {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
        {mode !== "confirm" && (
          <p className="text-sm text-center text-gray-500 mt-6">
            {mode === "login" ? "No account? " : "Have an account? "}
            <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
              className="text-indigo-600 font-medium hover:underline">
              {mode === "login" ? "Register" : "Sign in"}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
