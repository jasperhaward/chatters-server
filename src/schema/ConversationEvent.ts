import { Type, Static } from "@sinclair/typebox";
import { User } from "./User";
import { TConversation } from "./Conversation";

export enum ConversationEventType {
  ConversationCreated = "ConversationCreated",
  ConversationTitleUpdated = "ConversationTitleUpdated",
  MessageCreated = "MessageCreated",
  RecipientCreated = "RecipientCreated",
  RecipientRemoved = "RecipientRemoved",
  AddedToConversation = "AddedToConversation",
}

export const ConversationEventCommon = Type.Object({
  id: Type.Number(),
  conversationId: Type.String({ format: "uuid" }),
  type: Type.Enum(ConversationEventType),
  createdAt: Type.String({ format: "date-time" }),
  createdBy: User,
});

export type TConversationEventCommon = Static<typeof ConversationEventCommon>;

export const ConversationCreatedEvent = Type.Intersect([
  ConversationEventCommon,
  Type.Object({
    type: Type.Literal(ConversationEventType.ConversationCreated),
  }),
]);

export type TConversationCreatedEvent = Static<typeof ConversationCreatedEvent>;

export const TitleUpdatedEvent = Type.Intersect([
  ConversationEventCommon,
  Type.Object({
    type: Type.Literal(ConversationEventType.ConversationTitleUpdated),
    title: Type.String(),
  }),
]);

export type TTitleUpdatedEvent = Static<typeof TitleUpdatedEvent>;

export const MessageCreatedEvent = Type.Intersect([
  ConversationEventCommon,
  Type.Object({
    type: Type.Literal(ConversationEventType.MessageCreated),
    message: Type.String(),
  }),
]);

export type TMessageCreatedEvent = Static<typeof MessageCreatedEvent>;

export const RecipientCreatedEvent = Type.Intersect([
  ConversationEventCommon,
  Type.Object({
    type: Type.Literal(ConversationEventType.RecipientCreated),
    recipient: User,
  }),
]);

export type TRecipientCreatedEvent = Static<typeof RecipientCreatedEvent>;

export const RecipientRemovedEvent = Type.Intersect([
  ConversationEventCommon,
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

export interface TAddedToConversationEvent extends TConversation {
  type: ConversationEventType.AddedToConversation;
}

export type TUiConversationEvent =
  | TConversationEvent
  | TAddedToConversationEvent;
