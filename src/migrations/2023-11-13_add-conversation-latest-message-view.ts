import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createView("conversation_latest_message")
    .as(
      db
        .selectFrom("conversation_message as m")
        .distinctOn("m.conversation_id")
        .selectAll()
        .orderBy("m.conversation_id")
        .orderBy("m.created_at", "desc")
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropView("conversation_latest_message").execute();
}
