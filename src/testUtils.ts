import {
  ConversationEventType,
  TConversationCreatedEvent,
  TMessageCreatedEvent,
  TRecipientCreatedEvent,
} from "./schema";

export function createConversationCreatedEvent(
  event?: Partial<TConversationCreatedEvent>
): TConversationCreatedEvent {
  return {
    id: 68,
    conversationId: "9a8892f9-3a38-4d97-ba80-08bd717ec762",
    type: ConversationEventType.ConversationCreated,
    createdAt: "2024-10-27T21:24:23.577Z",
    createdBy: {
      id: "83f250f5-9396-42ca-b326-1ed45d6fb10b",
      username: "Jim Bob",
    },
    ...event,
  };
}

export function createMessageCreatedEvent(
  event?: Partial<TMessageCreatedEvent>
): TMessageCreatedEvent {
  return {
    id: 68,
    conversationId: "9a8892f9-3a38-4d97-ba80-08bd717ec762",
    type: ConversationEventType.MessageCreated,
    createdAt: "2024-10-27T21:24:23.577Z",
    createdBy: {
      id: "83f250f5-9396-42ca-b326-1ed45d6fb10b",
      username: "Jim Bob",
    },
    message: "Example message",
    ...event,
  };
}

export function createRecipientCreatedEvent(
  event?: Partial<TRecipientCreatedEvent>
): TRecipientCreatedEvent {
  return {
    id: 68,
    conversationId: "9a8892f9-3a38-4d97-ba80-08bd717ec762",
    type: ConversationEventType.RecipientCreated,
    createdAt: "2024-10-27T21:24:23.577Z",
    createdBy: {
      id: "83f250f5-9396-42ca-b326-1ed45d6fb10b",
      username: "Jim Bob",
    },
    recipient: {
      id: "18d87750-5a03-46e1-b0a2-f04537f57c96",
      username: "Jose Choi",
    },
    ...event,
  };
}
