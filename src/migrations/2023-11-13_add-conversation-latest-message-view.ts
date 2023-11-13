import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createView("conversation_latest_message")
    .as(
      db
        .selectFrom("conversation as c")
        .innerJoin(
          "conversation_message as m",
          "m.conversation_id",
          "c.conversation_id"
        )
        .distinctOn("c.conversation_id")
        .select([
          "c.conversation_id",
          "m.id as latest_message_id",
          "m.created_at as latest_message_created_at",
          "m.created_by as latest_message_created_by",
          "m.content as latest_message_content",
        ])
        .orderBy("c.conversation_id")
        .orderBy("m.created_at", "desc")
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropView("conversation_latest_message").execute();
}
