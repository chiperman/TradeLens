"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useTranslations } from "next-intl";
import { sileo } from "sileo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { Link, useRouter } from "@/i18n/routing";

export default function RegisterPage() {
  const router = useRouter();
  const t = useTranslations("Auth");
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      sileo.error({ title: error.message });
    } else {
      sileo.success({ title: t("verifyEmail") });
      router.push("/login");
    }
    setLoading(false);
  };

  const handleGitHubLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) sileo.error({ title: error.message });
    setLoading(false);
  };

  return (
    <Card className="border-none shadow-2xl shadow-primary/5 bg-card/80 backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center pb-2">
        <CardTitle className="text-xl font-bold tracking-tight">{t("registerTitle")}</CardTitle>
        <CardDescription className="text-xs">{t("registerSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reg-email" className="text-xs font-medium">
              {t("email")}
            </Label>
            <Input
              id="reg-email"
              type="email"
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-password" className="text-xs font-medium">
              {t("password")}
            </Label>
            <Input
              id="reg-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-10"
            />
          </div>
          <Button type="submit" className="w-full h-10 font-semibold" disabled={loading}>
            {loading ? t("registering") : t("registerButton")}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">{t("orContinueWith")}</span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full h-10 gap-2 font-medium"
          onClick={handleGitHubLogin}
          disabled={loading}
        >
          <Github className="w-4 h-4" />
          {t("githubRegister")}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          {t("hasAccount")}{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            {t("goToLogin")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
