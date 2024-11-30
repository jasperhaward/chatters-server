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
  TConversationEventWithAggregates,
} from "../schema";
import { areEventsWithinOneMinute } from "../utils";
import { sortUsersByUsername } from "./userStore";

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
    case ConversationEventType.TitleUpdated:
      return {
        ...common,
        type: ConversationEventType.TitleUpdated,
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
    .orderBy("e.id", "desc")
    .execute();

  return rows.map(toConversationEventSchema);
}

function areEventsAggregatable(
  a: TConversationEventCommon,
  b: TConversationEventCommon
) {
  return a.createdBy.id === b.createdBy.id && areEventsWithinOneMinute(a, b);
}

export function applyAggregates(events: TConversationEvent[]) {
  return events.reduce<TConversationEventWithAggregates[]>(
    (aggregateEvents, event, index) => {
      const previousEvent = aggregateEvents[aggregateEvents.length - 1];
      const nextEvent = events[index + 1];

      if (
        event.type === ConversationEventType.RecipientCreated &&
        previousEvent?.type ===
          ConversationEventType.RecipientsCreatedAggregate &&
        areEventsAggregatable(event, previousEvent)
      ) {
        previousEvent.recipients.push(event.recipient);
        previousEvent.recipients.sort(sortUsersByUsername);
      } else if (
        event.type === ConversationEventType.RecipientCreated &&
        nextEvent?.type === ConversationEventType.RecipientCreated &&
        areEventsAggregatable(event, nextEvent)
      ) {
        aggregateEvents.push({
          ...event,
          type: ConversationEventType.RecipientsCreatedAggregate,
          recipients: [event.recipient],
        });
      } else {
        aggregateEvents.push(event);
      }

      return aggregateEvents;
    },
    []
  );
}

type InsertConversationEventParams =
  | {
      conversationId: string;
      type: ConversationEventType.ConversationCreated;
      createdBy: string;
    }
  | {
      conversationId: string;
      type: ConversationEventType.TitleUpdated;
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

  return events[0]!;
}
