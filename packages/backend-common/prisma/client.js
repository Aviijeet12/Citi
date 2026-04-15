let prismaClient = null;

function resolveSslMode() {
  const isLocal = process.env.IS_LOCAL === "true" || !process.env.IS_LOCAL;
  return isLocal ? "disable" : "require";
}

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const host = process.env.POSTGRES_HOST || "localhost";
  const port = process.env.POSTGRES_PORT || "5432";
  const database = process.env.POSTGRES_NAME || "postgres";
  const user = encodeURIComponent(process.env.POSTGRES_USER || "postgres");
  const password = encodeURIComponent(process.env.POSTGRES_PASS || "postgres123");
  const sslmode = resolveSslMode();

  const databaseUrl = `postgresql://${user}:${password}@${host}:${port}/${database}?schema=public&sslmode=${sslmode}`;
  process.env.DATABASE_URL = databaseUrl;
  return databaseUrl;
}

function getPrismaClient() {
  if (prismaClient) {
    return prismaClient;
  }

  getDatabaseUrl();

  const { PrismaClient } = require("@prisma/client");
  prismaClient = new PrismaClient();
  return prismaClient;
}

async function disconnectPrisma() {
  if (!prismaClient) {
    return;
  }

  await prismaClient.$disconnect();
  prismaClient = null;
}

module.exports = {
  disconnectPrisma,
  getDatabaseUrl,
  getPrismaClient,
};
