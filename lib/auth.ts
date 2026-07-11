import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-dev-secret";

const VERTICALS = ["hotels", "apartments", "rental", "workplace"] as const;
export type Vertical = (typeof VERTICALS)[number];
export const ALL_VERTICALS: readonly Vertical[] = VERTICALS;

export interface JwtPayload {
  user_id: string;
  email: string;
  role_name: string;
  role_id?: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
  /** Tenant shard fields — only set for shard (non-platform) users */
  tenant_code?: string;
  tenant_schema?: string;
  tenant_name?: string;
  tenant_verticals?: Vertical[];
  /** Platform admin flag — true for eHMS platform superadmins */
  is_platform_admin?: boolean;
  /** Property-scoped access — assigned property IDs for property_manager / department roles */
  assigned_property_ids?: string[];
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
