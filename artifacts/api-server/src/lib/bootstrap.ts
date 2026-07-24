import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { adminsTable } from "@workspace/db/schema";
import { count } from "drizzle-orm";
import { logger } from "./logger";

/**
 * If no admins exist yet, create a default super_admin account and log the
 * generated credentials. This only runs on first startup of a fresh database.
 */
export async function bootstrapFirstAdmin(): Promise<void> {
  try {
    const [{ cnt }] = await db.select({ cnt: count() }).from(adminsTable);
    if (Number(cnt) > 0) return; // admins already exist — skip

    const tempPassword = randomBytes(8).toString("hex"); // 16 hex chars
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    await db.insert(adminsTable).values({
      username: "admin",
      passwordHash,
      role: "super_admin",
      displayName: "முதன்மை நிர்வாகி",
    });

    // Log prominently so the operator can read it from server logs
    logger.info(
      {
        username: "admin",
        temporaryPassword: tempPassword,
      },
      "⚠️  First-run bootstrap: default admin created. Change this password immediately via /admin/admins after logging in."
    );
  } catch (err) {
    logger.error({ err }, "bootstrap: failed to create first admin");
    throw err;
  }
}
