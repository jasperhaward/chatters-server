export interface ConversationEvent {
  type: string;
  conversationId: string;
  createdAt: string;
  createdBy: string;
}

export interface ConversationCreatedEvent extends ConversationEvent {
  type: "ConversationCreated";
}

export interface ConversationUpdatedEvent extends ConversationEvent {
  type: "ConversationUpdated";
  title: string;
}

export interface MessageCreatedEvent extends ConversationEvent {
  type: "MessageCreated";
  message: string;
}

export interface RecipientCreatedEvent extends ConversationEvent {
  type: "RecipientCreated";
  recipientId: string;
}

export interface RecipientRemovedEvent extends ConversationEvent {
  type: "RecipientRemoved";
  recipientId: string;
}

export interface ErrorEvent {
  type: "Error";
  payload: {
    code: string;
    message: string;
  };
}
