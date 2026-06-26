import { NextResponse, type NextRequest } from "next/server";
import { verifyToken, type JwtPayload } from "@/lib/auth";
import { ROLE_ACCESS } from "@/lib/role-access";

const PUBLIC_ROUTES = ["/", "/tenants", "/login", "/_next/", "/favicon.ico", "/eHMS_logo.png", "/favicon.png"];

function isPublic(pathname: string): boolean {
  return PUBLIC_ROUTES.some((p) => pathname.startsWith(p));
}

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const token = request.cookies.get("ehms_token")?.value;
  const payload: JwtPayload | null = token ? verifyToken(token) : null;

  const isPlatformAdmin = payload?.is_platform_admin === true;

  if (!payload && !isPublic(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (payload && pathname === "/tenants") {
    // Platform admins may provision shards at /tenants; shard users go to dashboard
    if (!isPlatformAdmin) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    // Let platform admin through to /tenants
  } else if (payload && (pathname === "/" || pathname === "/login")) {
    // Platform admin goes to tenant management; shard user goes to dashboard
    const redirect = isPlatformAdmin ? "/dashboard/admin/tenants" : "/dashboard";
    return NextResponse.redirect(new URL(redirect, request.url));
  }

  if (payload && !isPlatformAdmin && pathname.startsWith("/dashboard")) {
    // Shard user — check RBAC
    const allowed = ROLE_ACCESS[payload.role_name] || [];
    const hasAccess = allowed.some(
      (p) => pathname === p || (pathname.startsWith(p + "/") && p !== "/dashboard")
    );
    if (!hasAccess && pathname !== "/dashboard") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  if (isPlatformAdmin && pathname.startsWith("/dashboard")) {
    // Platform admin can access /dashboard/admin/tenants (and sub-paths)
    if (!pathname.startsWith("/dashboard/admin/tenants") && pathname !== "/dashboard/admin") {
      return NextResponse.redirect(new URL("/dashboard/admin/tenants", request.url));
    }
  }

  const response = NextResponse.next({ request });
  if (payload) {
    response.headers.set("x-user-id", payload.user_id);
    response.headers.set("x-user-email", payload.email);
    response.headers.set("x-user-role", payload.role_name);
    response.headers.set("x-is-platform-admin", String(isPlatformAdmin));
    if (isPlatformAdmin) {
      response.headers.set("x-tenant-code", "");
      response.headers.set("x-tenant-schema", "");
      response.headers.set("x-tenant-name", "");
    } else {
      response.headers.set("x-tenant-code", payload.tenant_code || "");
      response.headers.set("x-tenant-schema", payload.tenant_schema || "");
      response.headers.set("x-tenant-name", payload.tenant_name || "");
      response.headers.set("x-tenant-verticals", (payload.tenant_verticals || []).join(","));
    }
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
