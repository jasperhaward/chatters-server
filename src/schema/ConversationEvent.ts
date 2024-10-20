import { Type, Static } from "@sinclair/typebox";
import { User } from "./User";

export enum ConversationEventType {
  ConversationCreated = "ConversationCreated",
  ConversationTitleUpdated = "ConversationTitleUpdated",
  MessageCreated = "MessageCreated",
  RecipientCreated = "RecipientCreated",
  RecipientRemoved = "RecipientRemoved",
}

// Common fields between all ConversationEvent types

export const ConversationEventShared = Type.Object({
  id: Type.Number(),
  conversationId: Type.String({ format: "uuid" }),
  type: Type.Enum(ConversationEventType),
  createdAt: Type.String({ format: "date-time" }),
  createdBy: User,
});

export type TConversationEventShared = Static<typeof ConversationEventShared>;

// ConversationCreatedEvent

export const ConversationCreatedEvent = Type.Intersect([
  ConversationEventShared,
  Type.Object({
    type: Type.Literal(ConversationEventType.ConversationCreated),
  }),
]);

export type TConversationCreatedEvent = Static<typeof ConversationCreatedEvent>;

// TitleUpdatedEvent

export const TitleUpdatedEvent = Type.Intersect([
  ConversationEventShared,
  Type.Object({
    type: Type.Literal(ConversationEventType.ConversationTitleUpdated),
    title: Type.String(),
  }),
]);

export type TTitleUpdatedEvent = Static<typeof TitleUpdatedEvent>;

// MessageCreatedEvent

export const MessageCreatedEvent = Type.Intersect([
  ConversationEventShared,
  Type.Object({
    type: Type.Literal(ConversationEventType.MessageCreated),
    message: Type.String(),
  }),
]);

export type TMessageCreatedEvent = Static<typeof MessageCreatedEvent>;

// RecipientCreatedEvent

export const RecipientCreatedEvent = Type.Intersect([
  ConversationEventShared,
  Type.Object({
    type: Type.Literal(ConversationEventType.RecipientCreated),
    recipient: User,
  }),
]);

export type TRecipientCreatedEvent = Static<typeof RecipientCreatedEvent>;

// RecipientRemovedEvent

export const RecipientRemovedEvent = Type.Intersect([
  ConversationEventShared,
  Type.Object({
    type: Type.Literal(ConversationEventType.RecipientRemoved),
    recipient: User,
  }),
]);

export type TRecipientRemovedEvent = Static<typeof RecipientRemovedEvent>;

export const ConversationEvent = Type.Union([
  TitleUpdatedEvent,
  MessageCreatedEvent,
  RecipientCreatedEvent,
  RecipientRemovedEvent,
  // ConversationCreatedEvent must last here otherwise additional fields for other
  // event types are removed because the ConversationCreatedEvent schema matches first
  ConversationCreatedEvent,
]);

export type TConversationEvent = Static<typeof ConversationEvent>;
