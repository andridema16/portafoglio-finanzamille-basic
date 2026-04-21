import { createHmac, timingSafeEqual } from "crypto";
import type { UserRole } from "@/types/portafoglio";
import { getCurrentSitePassword } from "@/lib/password";

export function hashTokenWithRole(password: string, secret: string, role: UserRole): string {
  return createHmac("sha256", secret).update(`${role}:${password}`).digest("hex");
}

export async function verifyTokenAndGetRole(token: string): Promise<UserRole | null> {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const authSecret = process.env.AUTH_SECRET;

  if (!adminPassword || !authSecret) return null;

  let sitePassword: string;
  try {
    sitePassword = await getCurrentSitePassword();
  } catch {
    return null;
  }

  const tokenBuffer = Buffer.from(token);

  const adminToken = Buffer.from(hashTokenWithRole(adminPassword, authSecret, "admin"));
  if (tokenBuffer.length === adminToken.length && timingSafeEqual(tokenBuffer, adminToken)) {
    return "admin";
  }

  const userToken = Buffer.from(hashTokenWithRole(sitePassword, authSecret, "user"));
  if (tokenBuffer.length === userToken.length && timingSafeEqual(tokenBuffer, userToken)) {
    return "user";
  }

  return null;
}
