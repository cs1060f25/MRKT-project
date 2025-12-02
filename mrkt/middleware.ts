import { clerkMiddleware, getAuth } from "@clerk/nextjs/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Get authentication state
  const { userId, getToken } = await auth();

  // Create response
  const res = NextResponse.next();

  // Create Supabase client for middleware
  const supabase = createMiddlewareClient(req, res);

  // If user is authenticated, sync Clerk JWT with Supabase session
  if (userId) {
    try {
      // Get Clerk JWT with Supabase claims
      const token = await getToken({ template: "supabase" });

      console.log("[Middleware] Clerk userId:", userId);
      console.log("[Middleware] Got Supabase JWT token:", token ? "yes" : "no");

      if (token) {
        // Set Supabase session with Clerk JWT
        const { data, error } = await supabase.auth.setSession({
          access_token: token,
          refresh_token: "", // Clerk manages refresh
        });
        console.log(
          "[Middleware] Supabase session set:",
          error ? `error: ${error.message}` : "success"
        );
      } else {
        console.warn(
          "[Middleware] No token received - JWT template 'supabase' might not exist"
        );
      }
    } catch (error) {
      console.error("Failed to sync Clerk JWT with Supabase:", error);
    }
  } else {
    // User not authenticated, ensure Supabase session is cleared
    await supabase.auth.signOut();
  }

  return res;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};


