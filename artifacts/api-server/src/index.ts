import app from "./app";
import { logger } from "./lib/logger";
import { bootstrapFirstAdmin, bootstrapSessionsTable } from "./lib/bootstrap";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Ensure the sessions table exists (idempotent — safe on every restart)
await bootstrapSessionsTable();

// Seed the first admin if the database has no admins yet
await bootstrapFirstAdmin();

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
