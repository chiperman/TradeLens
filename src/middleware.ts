import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

// Routes that don't require authentication
const PUBLIC_PATHS = ["/login", "/register", "/auth/callback"];

function isPublicPath(pathname: string): boolean {
  // Strip locale prefix: /zh/login -> /login
  const segments = pathname.split("/").filter(Boolean);
  const pathWithoutLocale = "/" + segments.slice(1).join("/");

  return PUBLIC_PATHS.some((p) => pathWithoutLocale.startsWith(p));
}

function isAuthPath(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  const pathWithoutLocale = "/" + segments.slice(1).join("/");

  return pathWithoutLocale === "/login" || pathWithoutLocale === "/register";
}

export async function middleware(request: NextRequest) {
  // First, run intl middleware to handle locale
  const intlResponse = intlMiddleware(request);

  // For auth callback, skip auth check
  if (request.nextUrl.pathname.includes("/auth/callback")) {
    return intlResponse;
  }

  // Create Supabase client for auth check
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // We'll set cookies on the response below
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // If user is not authenticated and trying to access protected route
  if (!user && !isPublicPath(pathname)) {
    const locale = pathname.split("/")[1] || routing.defaultLocale;
    const loginUrl = new URL(`/${locale}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (user && isAuthPath(pathname)) {
    const locale = pathname.split("/")[1] || routing.defaultLocale;
    const dashboardUrl = new URL(`/${locale}`, request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Set cookies on the response from intl middleware
  return intlResponse;
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)", "/", "/(zh|en)/:path*"],
};
