"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { type User } from "@supabase/supabase-js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User as UserIcon, LogOut, Settings, LogIn, RefreshCw, Github } from "lucide-react";
import { SettingsModal } from "./settings-modal";

export function AuthComponent() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else setIsOpen(false);
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else {
      alert("验证邮件已发送，请检查邮箱后登录");
      setIsOpen(false);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleGitHubLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) alert(error.message);
    setLoading(false);
  };

  const handleSync = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("请先登录");

      const response = await fetch("/api/binance/sync", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      alert(`同步成功！共同步 ${data.count} 笔交易记录。`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "同步失败");
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <UserIcon className="w-5 h-5 text-primary" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>我的账户</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs text-muted-foreground">
              {user.email}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSync} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              <span>{loading ? "同步中..." : "立即同步交易"}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
              <Settings className="mr-2 h-4 w-4" />
              <span>设置</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>登出</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <SettingsModal isOpen={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
      </>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-9 px-4 rounded-full border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all text-[10px] font-black uppercase tracking-widest">
          <LogIn className="w-3.5 h-3.5" />
          登录 / 注册
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] border-none shadow-2xl rounded-[2rem] p-8 bg-white/95 backdrop-blur-xl">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-black tracking-tighter text-slate-900">加入 TradeLens</DialogTitle>
          <DialogDescription className="text-xs font-medium text-slate-400">
            登录以同步您的计算历史和交易所 API 配置。
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="login" className="w-full mt-6">
          <TabsList className="grid w-full grid-cols-2 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50">
            <TabsTrigger value="login" className="text-[10px] font-black uppercase tracking-widest rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">登录</TabsTrigger>
            <TabsTrigger value="register" className="text-[10px] font-black uppercase tracking-widest rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">注册</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <form onSubmit={handleSignIn} className="space-y-5 pt-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rounded-xl border-slate-200 h-11 focus-visible:ring-blue-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">密码</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="rounded-xl border-slate-200 h-11 focus-visible:ring-blue-500/20"
                />
              </div>
              <Button type="submit" className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-slate-200" disabled={loading}>
                {loading ? "登录中..." : "登录系统"}
              </Button>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-100" />
                </div>
                <div className="relative flex justify-center text-[9px] font-black uppercase">
                  <span className="bg-white px-4 text-slate-300 tracking-widest">Social Login</span>
                </div>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full h-11 rounded-xl gap-3 border-slate-200 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all" 
                onClick={handleGitHubLogin} 
                disabled={loading}
              >
                <Github className="w-4 h-4" />
                GitHub 账号登录
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="register" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <form onSubmit={handleSignUp} className="space-y-5 pt-6">
              <div className="space-y-2">
                <Label htmlFor="reg-email" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">邮箱</Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rounded-xl border-slate-200 h-11 focus-visible:ring-blue-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">密码</Label>
                <Input
                  id="reg-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="rounded-xl border-slate-200 h-11 focus-visible:ring-blue-500/20"
                />
              </div>
              <Button type="submit" className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-blue-100" disabled={loading}>
                {loading ? "注册中..." : "创建新账户"}
              </Button>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-100" />
                </div>
                <div className="relative flex justify-center text-[9px] font-black uppercase">
                  <span className="bg-white px-4 text-slate-300 tracking-widest">Social Registration</span>
                </div>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full h-11 rounded-xl gap-3 border-slate-200 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all" 
                onClick={handleGitHubLogin} 
                disabled={loading}
              >
                <Github className="w-4 h-4" />
                通过 GitHub 快速注册
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
