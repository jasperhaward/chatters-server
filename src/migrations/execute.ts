import path from "path";
import fs from "fs/promises";
import { Pool } from "pg";
import {
  Kysely,
  Migrator,
  PostgresDialect,
  FileMigrationProvider,
} from "kysely";
import config from "../config";

async function migrateToLatest() {
  const db = new Kysely<any>({
    dialect: new PostgresDialect({
      pool: new Pool(config.database),
    }),
  });

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: __dirname,
    }),
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((m) => {
    if (m.status === "Success") {
      console.log(`Migration '${m.migrationName}' was executed successfully`);
    } else if (m.status === "Error") {
      console.error(`Migration '${m.migrationName}' failed to execute`);
    }
  });

  if (error) {
    console.error(error);
    process.exit(1);
  }

  await db.destroy();
}

migrateToLatest();
