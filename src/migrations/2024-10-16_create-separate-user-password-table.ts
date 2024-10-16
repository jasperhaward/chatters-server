import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("user_password")
    .addColumn("user_id", "uuid")
    .addForeignKeyConstraint(
      "user_account_constraint",
      ["user_id"],
      "user_account",
      ["user_id"]
    )
    .addColumn("password_hash", "varchar(250)")
    .execute();

  await db
    .insertInto("user_password")
    .columns(["user_id", "password_hash"])
    .expression((eb) =>
      eb.selectFrom("user_account").select(["user_id", "password"])
    )
    .execute();

  await db.schema.alterTable("user_account").dropColumn("password").execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("user_account")
    .addColumn("password", "varchar(250)")
    .execute();

  await db
    .updateTable("user_account")
    .set({
      password: db
        .selectFrom("user_password")
        .select("password_hash")
        .whereRef("user_password.user_id", "=", "user_account.user_id"),
    })
    .execute();
}
