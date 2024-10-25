import { Kysely } from "kysely";

import {
  Database,
  ConversationEventRow,
  InsertableConversationEventRow,
} from "../database";
import {
  ConversationEventType,
  TConversationEvent,
  TConversationEventCommon,
} from "../schema";

export interface ConversationEventRowWithJoins extends ConversationEventRow {
  created_by_username: string;
  recipient_username: string | null;
}

export function toConversationEventSchema(
  row: ConversationEventRowWithJoins
): TConversationEvent {
  const common: TConversationEventCommon = {
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
        ...common,
        type: ConversationEventType.ConversationCreated,
      };
    case ConversationEventType.ConversationTitleUpdated:
      return {
        ...common,
        type: ConversationEventType.ConversationTitleUpdated,
        title: row.title!,
      };
    case ConversationEventType.MessageCreated:
      return {
        ...common,
        type: ConversationEventType.MessageCreated,
        message: row.message!,
      };
    case ConversationEventType.RecipientCreated:
      return {
        ...common,
        type: ConversationEventType.RecipientCreated,
        recipient: {
          id: row.recipient_id!,
          username: row.recipient_username!,
        },
      };
    case ConversationEventType.RecipientRemoved:
      return {
        ...common,
        type: ConversationEventType.RecipientRemoved,
        recipient: {
          id: row.recipient_id!,
          username: row.recipient_username!,
        },
      };
    default:
      throw new Error(`Invalid event found ${row.id} - ${row.event_type}`);
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

type InsertConversationEventParams =
  | {
      conversationId: string;
      type: ConversationEventType.ConversationCreated;
      createdBy: string;
    }
  | {
      conversationId: string;
      type: ConversationEventType.ConversationTitleUpdated;
      createdBy: string;
      title: string | null;
    }
  | {
      conversationId: string;
      type: ConversationEventType.MessageCreated;
      createdBy: string;
      message: string;
    }
  | {
      conversationId: string;
      type: ConversationEventType.RecipientCreated;
      createdBy: string;
      recipientId: string;
    }
  | {
      conversationId: string;
      type: ConversationEventType.RecipientRemoved;
      createdBy: string;
      recipientId: string;
    };

type FilterByType<E, T> = Extract<E, { type: T }>;

export async function insertEvents<T extends ConversationEventType>(
  db: Kysely<Database>,
  events: FilterByType<InsertConversationEventParams, T>[]
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
  event: FilterByType<InsertConversationEventParams, T>
): Promise<FilterByType<TConversationEvent, T>> {
  const events = await insertEvents(db, [event]);

  return events[0];
}
