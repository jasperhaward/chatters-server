import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("user_account")
    .alterColumn("created_at", (ac) => ac.setDataType("timestamptz"))
    .execute();

  await db.schema
    .alterTable("user_token")
    .alterColumn("created_at", (ac) => ac.setDataType("timestamptz"))
    .execute();

  await db.schema
    .alterTable("conversation")
    .alterColumn("created_at", (ac) => ac.setDataType("timestamptz"))
    .execute();

  await db.schema
    .alterTable("conversation_message")
    .alterColumn("created_at", (ac) => ac.setDataType("timestamptz"))
    .execute();

  await db.schema
    .alterTable("conversation_recipient")
    .alterColumn("created_at", (ac) => ac.setDataType("timestamptz"))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("user_account")
    .alterColumn("created_at", (ac) => ac.setDataType("timestamp"))
    .execute();

  await db.schema
    .alterTable("user_token")
    .alterColumn("created_at", (ac) => ac.setDataType("timestamp"))
    .execute();

  await db.schema
    .alterTable("conversation")
    .alterColumn("created_at", (ac) => ac.setDataType("timestamp"))
    .execute();

  await db.schema
    .alterTable("conversation_message")
    .alterColumn("created_at", (ac) => ac.setDataType("timestamp"))
    .execute();

  await db.schema
    .alterTable("conversation_recipient")
    .alterColumn("created_at", (ac) => ac.setDataType("timestamp"))
    .execute();
}
