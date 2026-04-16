#!/usr/bin/env node
const { ensureSchema } = require("../packages/backend-common");

async function init() {
  console.log("Initializing database schema...");
  try {
    await ensureSchema();
    console.log("✅ Schema initialized/verified successfully.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Schema initialization failed:", err.message);
    process.exit(1);
  }
}

init();
