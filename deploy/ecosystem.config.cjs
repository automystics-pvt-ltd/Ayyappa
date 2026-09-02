module.exports = {
  apps: [
    {
      name: "ayyappan-api",
      cwd: __dirname,
      script: "./dist/index.mjs",
      interpreter: "node",
      interpreter_args: "--enable-source-maps",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: "3001",
        ALLOWED_ORIGINS: "https://vadamadurai-ayyappan-temple.automystics.tech",
        // Copy the values from your Replit secrets:
        DATABASE_URL: "postgresql://USER:PASS@HOST:5432/DBNAME",
        SESSION_SECRET: "REPLACE_WITH_YOUR_SESSION_SECRET",
        DEFAULT_OBJECT_STORAGE_BUCKET_ID: "REPLACE_IF_USING_GCS",
        PRIVATE_OBJECT_DIR: "REPLACE_IF_USING_GCS",
        PUBLIC_OBJECT_SEARCH_PATHS: "REPLACE_IF_USING_GCS",
        INITIAL_ADMIN_PASSWORD: "REPLACE_WITH_YOUR_ADMIN_PASSWORD",
      },
    },
  ],
};
