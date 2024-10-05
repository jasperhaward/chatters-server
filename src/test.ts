export interface ConversationCreatedEvent {
  type: "ConversationCreated";
  conversationId: string;
  createdAt: string;
  createdBy: string;
}

export interface ConversationTitleUpdatedEvent {
  type: "ConversationTitleUpdated";
  conversationId: string;
  createdAt: string;
  createdBy: string;
  payload: {
    title: string;
  };
}

export interface MessageCreatedEvent {
  type: "MessageCreated";
  conversationId: string;
  createdAt: string;
  createdBy: string;
  payload: {
    content: string;
  };
}

export interface RecipientCreatedEvent {
  type: "RecipientCreated";
  conversationId: string;
  createdAt: string;
  createdBy: string;
  payload: {
    userId: string;
  };
}

export interface RecipientRemovedEvent {
  type: "RecipientRemoved";
  conversationId: string;
  createdAt: string;
  createdBy: string;
  payload: {
    userId: string;
  };
}

export interface ErrorEvent {
  type: "Error";
  payload: {
    code: string;
    message: string;
  };
}
