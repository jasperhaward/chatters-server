import { randomUUID } from "crypto";
import { FastifyTypebox, ControllerOptions } from "../types";
import authentication from "../hooks/authenticationHook";

import {
  ConversationEventType,
  TConversation,
  TUiConversationEvent,
  TAddedToConversationEvent,
  TRecipient,
} from "../schema";
import { BadRequestError } from "../errors";
import { removeDuplicates } from "../utils";
import {
  isUserInRecipients,
  findUsersByUserIds,
  findUserByUserId,
  isExistingConversation,
  isExistingConversationWithRecipientIds,
  findConversationsByUserId,
  findConversationByConversationId,
  findEventsByConversationId,
  sortRecipientsByUsername,
  findRecipientsByConversationId,
  insertEvent,
  insertEvents,
} from "../stores";
import {
  GetConversationsSchema,
  CreateConversationSchema,
  GetEventsSchema,
  UpdateTitleSchema,
  CreateMessageSchema,
  CreateRecipientSchema,
  RemoveRecipientSchema,
} from "./conversationsSchema";

export interface ConversationsControllerOptions extends ControllerOptions {
  dispatchEvent: (
    recipients: string[] | TRecipient[],
    event: TUiConversationEvent
  ) => void;
}

export default async function conversationsController(
  fastify: FastifyTypebox,
  options: ConversationsControllerOptions
) {
  const { db, dispatchEvent } = options;

  fastify.get(
    "/",
    { schema: GetConversationsSchema, onRequest: authentication(db) },
    async (request) => {
      const { userId } = request.token;

      const conversations: TConversation[] = [];

      for (const conversation of await findConversationsByUserId(db, userId)) {
        const recipients = await findRecipientsByConversationId(
          db,
          conversation.conversationId
        );

        conversations.push({ ...conversation, recipients });
      }

      return conversations;
    }
  );

  fastify.post(
    "/",
    { schema: CreateConversationSchema, onRequest: authentication(db) },
    async (request) => {
      const { userId } = request.token;
      const { recipientIds, title } = request.body;

      const sanitisedRecipientIds = [userId, ...recipientIds].filter(
        removeDuplicates
      );

      if (sanitisedRecipientIds.length < 2) {
        throw new BadRequestError(
          "MinimumRecipientsRequired",
          "Conversation must have at least 2 unique recipients."
        );
      }

      const users = await findUsersByUserIds(db, sanitisedRecipientIds);

      if (users.length !== sanitisedRecipientIds.length) {
        throw new BadRequestError(
          "UserNotFound",
          `User from '${sanitisedRecipientIds.join("','")}' not found.`
        );
      }

      // should not be able to create duplicate direct conversations with only 2 recipients
      if (
        sanitisedRecipientIds.length === 2 &&
        (await isExistingConversationWithRecipientIds(
          db,
          sanitisedRecipientIds
        ))
      ) {
        throw new BadRequestError(
          "ExistingDirectConversation",
          `Direct conversation between user and '${sanitisedRecipientIds[1]}' already exists.`
        );
      }

      const events = await db.transaction().execute(async (trx) => {
        const conversationId = randomUUID();

        const conversationCreated = await insertEvent(trx, {
          conversationId,
          type: ConversationEventType.ConversationCreated,
          createdBy: userId,
        });

        let titleUpdated;

        if (title) {
          titleUpdated = await insertEvent(trx, {
            conversationId,
            type: ConversationEventType.TitleUpdated,
            createdBy: userId,
            title,
          });
        }

        const recipientsCreated = await insertEvents(
          trx,
          sanitisedRecipientIds.map((recipientId) => ({
            conversationId,
            type: ConversationEventType.RecipientCreated,
            createdBy: userId,
            recipientId,
          }))
        );

        return { conversationCreated, titleUpdated, recipientsCreated };
      });

      const recipients = events.recipientsCreated.map<TRecipient>((event) => ({
        ...event.recipient,
        createdAt: event.createdAt,
        createdBy: event.createdBy,
      }));

      const addedToConversationEvent: TAddedToConversationEvent = {
        type: ConversationEventType.AddedToConversation,
        conversationId: events.conversationCreated.conversationId,
        createdAt: events.conversationCreated.createdAt,
        createdBy: events.conversationCreated.createdBy,
        title: events.titleUpdated?.title || null,
        recipients,
        latestEvent: events.recipientsCreated.at(-1)!,
      };

      dispatchEvent(sanitisedRecipientIds, addedToConversationEvent);

      return events;
    }
  );

  fastify.get(
    "/:conversationId/events",
    { schema: GetEventsSchema, onRequest: authentication(db) },
    async (request) => {
      const { userId } = request.token;
      const { conversationId } = request.params;

      if (!(await isExistingConversation(db, conversationId))) {
        throw new BadRequestError(
          "ConversationNotFound",
          `Conversation with id '${conversationId}' not found.`
        );
      }

      const recipients = await findRecipientsByConversationId(
        db,
        conversationId
      );

      if (!isUserInRecipients(recipients, userId)) {
        throw new BadRequestError(
          "UserNotConversationRecipient",
          "User must be recipient of conversation."
        );
      }

      return await findEventsByConversationId(db, conversationId);
    }
  );

  fastify.patch(
    "/:conversationId/title",
    { schema: UpdateTitleSchema, onRequest: authentication(db) },
    async (request) => {
      const { userId } = request.token;
      const { conversationId } = request.params;
      const { title } = request.body;

      if (!(await isExistingConversation(db, conversationId))) {
        throw new BadRequestError(
          "ConversationNotFound",
          `Conversation with id '${conversationId}' not found.`
        );
      }

      const recipients = await findRecipientsByConversationId(
        db,
        conversationId
      );

      if (!isUserInRecipients(recipients, userId)) {
        throw new BadRequestError(
          "UserNotConversationRecipient",
          "User must be recipient of conversation."
        );
      }

      const titleUpdatedEvent = await insertEvent(db, {
        conversationId,
        type: ConversationEventType.TitleUpdated,
        createdBy: userId,
        title,
      });

      dispatchEvent(recipients, titleUpdatedEvent);

      return titleUpdatedEvent;
    }
  );

  fastify.post(
    "/:conversationId/messages",
    { schema: CreateMessageSchema, onRequest: authentication(db) },
    async (request) => {
      const { userId } = request.token;
      const { conversationId } = request.params;
      const { content } = request.body;

      if (!(await isExistingConversation(db, conversationId))) {
        throw new BadRequestError(
          "ConversationNotFound",
          `Conversation with id '${conversationId}' not found.`
        );
      }

      const recipients = await findRecipientsByConversationId(
        db,
        conversationId
      );

      if (!isUserInRecipients(recipients, userId)) {
        throw new BadRequestError(
          "UserNotConversationRecipient",
          "User must be recipient of conversation."
        );
      }

      const messageCreatedEvent = await insertEvent(db, {
        conversationId,
        type: ConversationEventType.MessageCreated,
        createdBy: userId,
        message: content.trim(),
      });

      dispatchEvent(recipients, messageCreatedEvent);

      return messageCreatedEvent;
    }
  );

  fastify.post(
    "/:conversationId/recipients",
    { schema: CreateRecipientSchema, onRequest: authentication(db) },
    async (request) => {
      const { userId } = request.token;
      const { conversationId } = request.params;
      const { recipientId } = request.body;

      const conversation = await findConversationByConversationId(
        db,
        conversationId
      );

      if (!conversation) {
        throw new BadRequestError(
          "ConversationNotFound",
          `Conversation with id '${conversationId}' not found.`
        );
      }

      const recipients = await findRecipientsByConversationId(
        db,
        conversationId
      );

      if (!isUserInRecipients(recipients, userId)) {
        throw new BadRequestError(
          "UserNotConversationRecipient",
          "User must be recipient of conversation."
        );
      }

      if (isUserInRecipients(recipients, recipientId)) {
        throw new BadRequestError(
          "UserIsConversationRecipient",
          `User with id '${recipientId}' is already recipient of conversation.`
        );
      }

      if (!(await findUserByUserId(db, recipientId))) {
        throw new BadRequestError(
          "UserNotFound",
          `User with id '${recipientId}' not found.`
        );
      }

      const recipientCreatedEvent = await insertEvent(db, {
        conversationId,
        type: ConversationEventType.RecipientCreated,
        createdBy: userId,
        recipientId,
      });

      dispatchEvent(recipients, recipientCreatedEvent);

      const addedRecipient: TRecipient = {
        ...recipientCreatedEvent.recipient,
        createdAt: recipientCreatedEvent.createdAt,
        createdBy: recipientCreatedEvent.createdBy,
      };

      const updatedRecipients = [...recipients, addedRecipient].sort(
        sortRecipientsByUsername
      );

      // when a recipient is added to a conversation, send the new recipient full conversation details
      const addedToConversationEvent: TAddedToConversationEvent = {
        type: ConversationEventType.AddedToConversation,
        ...conversation,
        recipients: updatedRecipients,
        latestEvent: recipientCreatedEvent,
      };

      dispatchEvent([addedRecipient.id], addedToConversationEvent);

      return recipientCreatedEvent;
    }
  );

  fastify.delete(
    "/:conversationId/recipients/:recipientId",
    { schema: RemoveRecipientSchema, onRequest: authentication(db) },
    async (request) => {
      const { userId } = request.token;
      const { conversationId, recipientId } = request.params;

      if (!(await isExistingConversation(db, conversationId))) {
        throw new BadRequestError(
          "ConversationNotFound",
          `Conversation with id '${conversationId}' not found.`
        );
      }

      const recipients = await findRecipientsByConversationId(
        db,
        conversationId
      );

      if (!isUserInRecipients(recipients, userId)) {
        throw new BadRequestError(
          "UserNotConversationRecipient",
          "User is not a conversation recipient."
        );
      }

      if (!isUserInRecipients(recipients, recipientId)) {
        throw new BadRequestError(
          "UserNotConversationRecipient",
          `User '${recipientId}' is not a conversation recipient.`
        );
      }

      if (recipients.length === 2) {
        throw new BadRequestError(
          "MinimumRecipientsRequired",
          "Conversation cannot have less than 2 recipients."
        );
      }

      const recipientRemovedEvent = await insertEvent(db, {
        conversationId,
        type: ConversationEventType.RecipientRemoved,
        createdBy: userId,
        recipientId,
      });

      dispatchEvent(recipients, recipientRemovedEvent);

      return recipientRemovedEvent;
    }
  );
}
