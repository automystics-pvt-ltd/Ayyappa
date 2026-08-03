import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { db, pool } from "@workspace/db";
import { adminsTable } from "@workspace/db/schema";
import { count } from "drizzle-orm";
import { logger } from "./logger";

/**
 * Ensure the sessions table exists.
 *
 * connect-pg-simple's built-in createTableIfMissing reads a .sql file via
 * __dirname, which breaks in the esbuild bundle.  We create it inline instead.
 * Safe to call on every startup — IF NOT EXISTS is idempotent.
 */
export async function bootstrapSessionsTable(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid    VARCHAR NOT NULL COLLATE "default",
        sess   JSON    NOT NULL,
        expire TIMESTAMP(6) NOT NULL,
        CONSTRAINT sessions_pkey PRIMARY KEY (sid)
      ) WITH (OIDS=FALSE)
    `);
    await client.query(
      `CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions (expire)`
    );
  } finally {
    client.release();
  }
}

/**
 * If no admins exist yet, create the first super_admin account.
 *
 * Password resolution order:
 *   1. INITIAL_ADMIN_PASSWORD env/secret  — use as-is (operator-controlled)
 *   2. Fallback                           — generate a random 16-char hex password
 *                                           and print it to the server log once.
 *
 * Username defaults to INITIAL_ADMIN_USERNAME env var, or "admin".
 */
export async function bootstrapFirstAdmin(): Promise<void> {
  try {
    const [{ cnt }] = await db.select({ cnt: count() }).from(adminsTable);
    if (Number(cnt) > 0) return; // admins already exist — skip

    const username = process.env["INITIAL_ADMIN_USERNAME"] ?? "admin";
    const envPassword = process.env["INITIAL_ADMIN_PASSWORD"];

    let plainPassword: string;
    let isRandom = false;

    if (envPassword && envPassword.length >= 6) {
      plainPassword = envPassword;
    } else {
      plainPassword = randomBytes(8).toString("hex"); // 16 hex chars
      isRandom = true;
    }

    const passwordHash = await bcrypt.hash(plainPassword, 12);

    await db.insert(adminsTable).values({
      username,
      passwordHash,
      role: "super_admin",
      displayName: "முதன்மை நிர்வாகி",
    });

    if (isRandom) {
      logger.warn(
        { username, temporaryPassword: plainPassword },
        "⚠️  First-run bootstrap: INITIAL_ADMIN_PASSWORD not set — random password generated. " +
          "Set INITIAL_ADMIN_PASSWORD as a Replit Secret to control this value."
      );
    } else {
      logger.info(
        { username },
        `✅ First-run bootstrap: admin account '${username}' created using INITIAL_ADMIN_PASSWORD.`
      );
    }
  } catch (err) {
    logger.error({ err }, "bootstrap: failed to create first admin");
    throw err;
  }
}
