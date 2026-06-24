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

  if (!payload && !isPublic(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (payload && (pathname === "/" || pathname === "/login" || pathname === "/tenants")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (payload && pathname.startsWith("/dashboard")) {
    const allowed = ROLE_ACCESS[payload.role_name] || [];
    const hasAccess = allowed.some(
      (p) => pathname === p || (pathname.startsWith(p + "/") && p !== "/dashboard")
    );
    if (!hasAccess && pathname !== "/dashboard") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  const response = NextResponse.next({ request });
  if (payload) {
    response.headers.set("x-user-id", payload.user_id);
    response.headers.set("x-user-email", payload.email);
    response.headers.set("x-user-role", payload.role_name);
    response.headers.set("x-tenant-code", payload.tenant_code);
    response.headers.set("x-tenant-schema", payload.tenant_schema);
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
