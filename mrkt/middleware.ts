import { clerkMiddleware, getAuth } from "@clerk/nextjs/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Get authentication state
  const { userId, getToken } = await auth();

  // Create response
  const res = NextResponse.next();

  // If user is authenticated, get Clerk JWT and pass to Supabase client
  if (userId) {
    try {
      // Get Clerk JWT with Supabase claims
      const token = await getToken({ template: "supabase" });

      console.log("[Middleware] Clerk userId:", userId);
      console.log("[Middleware] Got Supabase JWT token:", token ? "yes" : "no");

      if (token) {
        // Create Supabase client with JWT in Authorization header
        // This makes auth.jwt()->>'sub' work in RLS policies
        createMiddlewareClient(req, res, token);
        console.log("[Middleware] Supabase client created with JWT");
      } else {
        console.warn(
          "[Middleware] No token received - JWT template 'supabase' might not exist"
        );
        createMiddlewareClient(req, res);
      }
    } catch (error) {
      console.error("Failed to get Clerk JWT:", error);
      createMiddlewareClient(req, res);
    }
  } else {
    // User not authenticated
    createMiddlewareClient(req, res);
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


