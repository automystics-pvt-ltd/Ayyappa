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
 *
 * On shared/managed PostgreSQL (e.g. cPanel, Plesk, hosting providers) the
 * table is often pre-created by schema.sql running as a superuser, so the app
 * user doesn't own it.  PostgreSQL raises error 42501 ("must be owner") when
 * you run CREATE TABLE IF NOT EXISTS on a table you don't own.  We catch that
 * and the "already exists" error (42P07) and continue — the table is there,
 * which is all we need.
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
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === "42501" || code === "42P07") {
      // 42501 = insufficient_privilege (table owned by another user, e.g. postgres)
      // 42P07 = duplicate_table (race condition on parallel startup)
      // Either way the table already exists — that's all we need.
      logger.warn(
        { pgCode: code },
        "bootstrapSessionsTable: sessions table already exists (owned by another DB user) — skipping DDL"
      );
    } else {
      throw err;
    }
  } finally {
    client.release();
  }

  // Best-effort index creation — ignore permission/duplicate errors too.
  const idxClient = await pool.connect();
  try {
    await idxClient.query(
      `CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions (expire)`
    );
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code !== "42501" && code !== "42P07") throw err;
  } finally {
    idxClient.release();
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
