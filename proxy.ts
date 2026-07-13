import { NextResponse, type NextRequest } from "next/server";
import { verifyToken, type JwtPayload } from "@/lib/auth";
import { ROLE_ACCESS } from "@/lib/role-access";

const PUBLIC_ROUTES = ["/", "/tenants", "/login", "/_next/", "/favicon.ico", "/eHMS_logo.png", "/favicon.png"];

const PUBLIC_API_PREFIXES = [
  "/api/auth/login",
  "/api/auth/platform-login",
  "/api/admin/tenants"
];

function isPublic(pathname: string): boolean {
  if (pathname === "/") return true;
  if (PUBLIC_ROUTES.some((p) => p !== "/" && (pathname === p || pathname.startsWith(p + "/")))) {
    return true;
  }
  if (PUBLIC_API_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p + "?"))) {
    return true;
  }
  return false;
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
    // Platform admin can access /dashboard/admin/tenants, tickets, broadcasts (and sub-paths)
    if (
      !pathname.startsWith("/dashboard/admin/tenants") &&
      !pathname.startsWith("/dashboard/admin/tickets") &&
      !pathname.startsWith("/dashboard/admin/broadcasts") &&
      pathname !== "/dashboard/admin" &&
      pathname !== "/dashboard"
    ) {
      return NextResponse.redirect(new URL("/dashboard/admin/tenants", request.url));
    }
  }

  const requestHeaders = new Headers(request.headers);
  if (payload) {
    requestHeaders.set("x-user-id", payload.user_id);
    requestHeaders.set("x-user-email", payload.email);
    requestHeaders.set("x-user-role", payload.role_name);
    requestHeaders.set("x-is-platform-admin", String(isPlatformAdmin));
    if (isPlatformAdmin) {
      requestHeaders.set("x-tenant-code", "");
      requestHeaders.set("x-tenant-schema", "");
      requestHeaders.set("x-tenant-name", "");
    } else {
      requestHeaders.set("x-tenant-code", payload.tenant_code || "");
      requestHeaders.set("x-tenant-schema", payload.tenant_schema || "");
      requestHeaders.set("x-tenant-name", payload.tenant_name || "");
      requestHeaders.set("x-tenant-verticals", (payload.tenant_verticals || []).join(","));
      if (payload.assigned_property_ids && payload.assigned_property_ids.length > 0) {
        requestHeaders.set("x-user-property-ids", payload.assigned_property_ids.join(","));
      }
    }
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

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
      if (payload.assigned_property_ids && payload.assigned_property_ids.length > 0) {
        response.headers.set("x-user-property-ids", payload.assigned_property_ids.join(","));
      }
    }
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
