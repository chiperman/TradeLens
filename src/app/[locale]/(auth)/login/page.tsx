"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useTranslations } from "next-intl";
import { sileo } from "sileo";
import { useRouter } from "@/i18n/routing";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { Link } from "@/i18n/routing";

export default function LoginPage() {
  const t = useTranslations("Auth");
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      sileo.error({ title: error.message });
      setLoading(false);
    } else {
      router.push("/");
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
        <CardTitle className="text-xl font-bold tracking-tight">{t("loginTitle")}</CardTitle>
        <CardDescription className="text-xs">{t("loginSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-medium">
              {t("email")}
            </Label>
            <Input
              id="email"
              type="email"
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-medium">
              {t("password")}
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-10"
            />
          </div>
          <Button type="submit" className="w-full h-10 font-semibold" disabled={loading}>
            {loading ? t("loggingIn") : t("loginButton")}
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
          {t("githubLogin")}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          {t("noAccount")}{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            {t("goToRegister")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
