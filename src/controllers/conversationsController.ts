import { FastifyTypebox, ControllerOptions } from "../types";
import authentication from "../hooks/authenticationHook";

import { TConversation } from "../schema";
import { BadRequestError } from "../errors";
import { removeDuplicates } from "../utils";
import {
  findConversationsByUserId,
  insertConversation,
  findRecipientsByConversationId,
  isRecipientInConversation,
  insertRecipients,
  findMessagesByConversationId,
  insertMessage,
  deleteRecipient,
  isExistingConversation,
  findUsersByUserIds,
  InsertConversationParams,
  InsertRecipientsParams,
  InsertMessageParams,
  findUserByUserId,
  DeleteRecipientParams,
} from "../stores";
import {
  GetConversationsSchema,
  CreateConversationSchema,
  CreateConversationMessageSchema,
  CreateConversationRecipientSchema,
  DeleteConversationRecipientSchema,
} from "./conversationsSchema";

export default async function conversationsController(
  fastify: FastifyTypebox,
  options: ControllerOptions
) {
  const { db, sendEvent } = options;

  fastify.get(
    "/",
    {
      schema: GetConversationsSchema,
      onRequest: authentication(db),
    },
    async (request) => {
      const { userId } = request.token;

      const conversations: TConversation[] = [];

      for (const conversation of await findConversationsByUserId(db, userId)) {
        const messages = await findMessagesByConversationId(
          db,
          conversation.id
        );
        const recipients = await findRecipientsByConversationId(
          db,
          conversation.id
        );

        conversations.push({
          ...conversation,
          recipients: recipients.filter((recipient) => recipient.id !== userId),
          messages,
        });
      }

      return conversations;
    }
  );

  fastify.post(
    "/",
    {
      schema: CreateConversationSchema,
      onRequest: authentication(db),
    },
    async (request, reply) => {
      const { userId } = request.token;
      const { recipientIds, title } = request.body;

      const sanitisedRecipientIds = recipientIds
        .filter((recipientId) => recipientId !== userId)
        .filter(removeDuplicates);

      if (sanitisedRecipientIds.length < 1) {
        throw new BadRequestError(
          "MinimumRecipientsRequired",
          `conversation must have at least 1 recipient`
        );
      }

      const users = await findUsersByUserIds(db, sanitisedRecipientIds);

      if (users.length !== sanitisedRecipientIds.length) {
        throw new BadRequestError(
          "RecipientNotFound",
          `user with id from 'recipientIds' not found`
        );
      }

      const conversation = await db.transaction().execute(async (trx) => {
        const conversationParams: InsertConversationParams = {
          createdBy: userId,
          title,
        };

        const conversation = await insertConversation(trx, conversationParams);

        const recipientsParams: InsertRecipientsParams = {
          conversationId: conversation.id,
          recipientIds: [userId, ...sanitisedRecipientIds],
        };

        const recipients = await insertRecipients(trx, recipientsParams);

        return {
          ...conversation,
          recipients: recipients.filter((recipient) => recipient.id !== userId),
          messages: [],
        };
      });

      reply.code(201);

      sendEvent(sanitisedRecipientIds, {
        type: "conversation",
        payload: conversation,
      });

      return conversation;
    }
  );

  fastify.post(
    "/:conversationId/messages",
    {
      schema: CreateConversationMessageSchema,
      onRequest: authentication(db),
    },
    async (request, reply) => {
      const { userId } = request.token;
      const { conversationId } = request.params;
      const { content } = request.body;

      if (!(await isExistingConversation(db, conversationId))) {
        throw new BadRequestError(
          "ConversationNotFound",
          "conversation with id 'conversationId' not found"
        );
      }

      const recipients = await findRecipientsByConversationId(
        db,
        conversationId
      );

      if (!isRecipientInConversation(recipients, userId)) {
        throw new BadRequestError(
          "UserNotConversationRecipient",
          "user must be recipient of conversation"
        );
      }

      reply.code(201);

      const params: InsertMessageParams = {
        conversationId,
        createdBy: userId,
        content: content.trim(),
      };

      const message = await insertMessage(db, params);

      const eventRecipientIds = recipients
        .map((recipient) => recipient.id)
        .filter((recipientId) => recipientId !== userId);

      sendEvent(eventRecipientIds, {
        type: "message",
        payload: message,
      });

      return message;
    }
  );

  fastify.post(
    "/:conversationId/recipients",
    {
      schema: CreateConversationRecipientSchema,
      onRequest: authentication(db),
    },
    async (request, reply) => {
      const { userId } = request.token;
      const { conversationId } = request.params;
      const { recipientId } = request.body;

      if (!(await isExistingConversation(db, conversationId))) {
        throw new BadRequestError(
          "ConversationNotFound",
          "conversation with id 'conversationId' not found"
        );
      }

      if (!(await findUserByUserId(db, recipientId))) {
        throw new BadRequestError(
          "RecipientNotFound",
          `user with id 'recipientId' not found`
        );
      }

      const recipients = await findRecipientsByConversationId(
        db,
        conversationId
      );

      if (isRecipientInConversation(recipients, recipientId)) {
        throw new BadRequestError(
          "RecipientAlreadyConversationMember",
          "user with id 'recipientId' is already recipient of conversation"
        );
      }

      const params: InsertRecipientsParams = {
        conversationId,
        recipientIds: [recipientId],
      };

      const [recipient] = await insertRecipients(db, params);

      reply.code(201);

      const eventRecipientIds = recipients
        .map((recipient) => recipient.id)
        .filter((recipientId) => recipientId !== userId);

      sendEvent(eventRecipientIds, {
        type: "recipient/added",
        payload: recipient,
      });

      return recipient;
    }
  );

  fastify.delete(
    "/:conversationId/recipients",
    {
      schema: DeleteConversationRecipientSchema,
      onRequest: authentication(db),
    },
    async (request) => {
      const { userId } = request.token;
      const { conversationId } = request.params;
      const { recipientId } = request.body;

      if (!(await isExistingConversation(db, conversationId))) {
        throw new BadRequestError(
          "ConversationNotFound",
          "conversation with id 'conversationId' not found"
        );
      }

      const recipient = await findUserByUserId(db, recipientId);

      if (!recipient) {
        throw new BadRequestError(
          "RecipientNotFound",
          `user with id 'recipientId' not found`
        );
      }

      const recipients = await findRecipientsByConversationId(
        db,
        conversationId
      );

      if (!isRecipientInConversation(recipients, recipientId)) {
        throw new BadRequestError(
          "RecipientNotConversationMember",
          "user with id 'recipientId' must be recipient of conversation"
        );
      }

      if (recipients.length === 2) {
        throw new BadRequestError(
          "MinimumRecipientsRequired",
          "conversation must have at least 2 recipients"
        );
      }

      const params: DeleteRecipientParams = {
        conversationId,
        recipientId,
      };

      await deleteRecipient(db, params);

      const eventRecipientIds = recipients
        .map((recipient) => recipient.id)
        .filter((recipientId) => recipientId !== userId);

      sendEvent(eventRecipientIds, {
        type: "recipient/removed",
        payload: recipient,
      });

      return recipient;
    }
  );
}
