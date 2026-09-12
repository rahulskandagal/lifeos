"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiClient";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [seedDemoData, setSeedDemoData] = useState(true);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/api/auth/register", { method: "POST", body: JSON.stringify({ name, email, password, seedDemoData }) });
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) throw new Error("Account created — please sign in.");
      toast.success("Welcome to LifeOS!");
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message ?? "Could not create account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full gradient-accent opacity-20 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full gradient-accent opacity-20 blur-3xl" />

      <div className="w-full max-w-sm relative z-10 animate-fade-in-up">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="h-9 w-9 rounded-xl gradient-accent flex items-center justify-center text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">LifeOS</span>
        </div>

        <div className="card-surface p-6">
          <h1 className="text-lg font-semibold">Create your account</h1>
          <p className="text-sm text-muted mt-1 mb-6">Your next-generation productivity OS.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
            </div>
            <label className="flex items-center gap-2 text-xs text-muted">
              <input type="checkbox" checked={seedDemoData} onChange={(e) => setSeedDemoData(e.target.checked)} className="rounded accent-[var(--accent)]" />
              Populate with sample tasks, habits &amp; goals
            </label>
            <p className="text-[11px] text-muted -mt-2">
              You can erase this (or any of your data) any time from Settings → Data.
            </p>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account…" : "Create account"}
            </Button>
          </form>
        </div>

        <p className="text-sm text-muted text-center mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-accent font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
