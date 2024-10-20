import { Kysely } from "kysely";

import {
  Database,
  ConversationEventRow,
  InsertableConversationEventRow,
} from "../database";
import {
  ConversationEventType,
  TConversationEvent,
  TConversationEventShared,
} from "../schema";

interface PopulatedConversationEventRow extends ConversationEventRow {
  created_by_username: string;
  recipient_username: string | null;
}

function toConversationEventSchema(
  row: PopulatedConversationEventRow
): TConversationEvent {
  const shared: TConversationEventShared = {
    id: row.id,
    type: row.event_type,
    conversationId: row.conversation_id,
    createdAt: row.created_at,
    createdBy: {
      id: row.created_by,
      username: row.created_by_username,
    },
  };

  switch (row.event_type) {
    case ConversationEventType.ConversationCreated:
      return {
        ...shared,
        type: ConversationEventType.ConversationCreated,
      };
    case ConversationEventType.ConversationTitleUpdated:
      return {
        ...shared,
        type: ConversationEventType.ConversationTitleUpdated,
        title: row.title!,
      };
    case ConversationEventType.MessageCreated:
      return {
        ...shared,
        type: ConversationEventType.MessageCreated,
        message: row.message!,
      };
    case ConversationEventType.RecipientCreated:
      return {
        ...shared,
        type: ConversationEventType.RecipientCreated,
        recipient: {
          id: row.recipient_id!,
          username: row.recipient_username!,
        },
      };
    case ConversationEventType.RecipientRemoved:
      return {
        ...shared,
        type: ConversationEventType.RecipientRemoved,
        recipient: {
          id: row.recipient_id!,
          username: row.recipient_username!,
        },
      };
  }
}

export async function findEventsByConversationId(
  db: Kysely<Database>,
  conversationId: string
): Promise<TConversationEvent[]> {
  const rows = await db
    .selectFrom("conversation_event as e")
    .innerJoin("user_account as eu", "eu.user_id", "e.created_by")
    .select("eu.username as created_by_username")
    .leftJoin("user_account as ru", "ru.user_id", "e.recipient_id")
    .select("ru.username as recipient_username")
    .selectAll("e")
    .where("e.conversation_id", "=", conversationId)
    .execute();

  return rows.map(toConversationEventSchema);
}

interface ConversationCreatedEventParameters {
  conversationId: string;
  type: ConversationEventType.ConversationCreated;
  createdBy: string;
}

interface TitleUpdatedEventParameters {
  conversationId: string;
  type: ConversationEventType.ConversationTitleUpdated;
  createdBy: string;
  title: string | null;
}

interface MessageCreatedEventParameters {
  conversationId: string;
  type: ConversationEventType.MessageCreated;
  createdBy: string;
  message: string;
}

interface RecipientCreatedEventParameters {
  conversationId: string;
  type: ConversationEventType.RecipientCreated;
  createdBy: string;
  recipientId: string;
}

interface RecipientRemovedEventParameters {
  conversationId: string;
  type: ConversationEventType.RecipientRemoved;
  createdBy: string;
  recipientId: string;
}

type ConversationEventParameters =
  | ConversationCreatedEventParameters
  | TitleUpdatedEventParameters
  | MessageCreatedEventParameters
  | RecipientCreatedEventParameters
  | RecipientRemovedEventParameters;

type FilterByType<E, T> = Extract<E, { type: T }>;

export async function insertEvents<T extends ConversationEventType>(
  db: Kysely<Database>,
  events: FilterByType<ConversationEventParameters, T>[]
): Promise<FilterByType<TConversationEvent, T>[]> {
  const values = events.map<InsertableConversationEventRow>((event) => ({
    conversation_id: event.conversationId,
    event_type: event.type,
    created_by: event.createdBy,
    title: "title" in event ? event.title : null,
    message: "message" in event ? event.message : null,
    recipient_id: "recipientId" in event ? event.recipientId : null,
  }));

  const rows = await db
    .with("e", (db) =>
      db.insertInto("conversation_event").values(values).returningAll()
    )
    .selectFrom("e")
    .innerJoin("user_account as eu", "eu.user_id", "e.created_by")
    .select("eu.username as created_by_username")
    .leftJoin("user_account as ru", "ru.user_id", "e.recipient_id")
    .select("ru.username as recipient_username")
    .selectAll("e")
    .execute();

  // prettier-ignore
  return rows.map(toConversationEventSchema) as FilterByType<TConversationEvent, T>[];
}

export async function insertEvent<T extends ConversationEventType>(
  db: Kysely<Database>,
  event: FilterByType<ConversationEventParameters, T>
): Promise<FilterByType<TConversationEvent, T>> {
  const events = await insertEvents(db, [event]);

  return events[0];
}
