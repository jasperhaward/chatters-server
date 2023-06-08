import { FastifyTypebox, ControllerOptions } from "../types";
import authentication from "../hooks/authentication";

import { TConversation } from "../schema";
import { BadRequestError, removeDuplicates } from "../util";
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
  isExistingUser,
  DeleteRecipientParams,
} from "../stores";
import {
  GetConversationsSchema,
  CreateConversationSchema,
  CreateConversationMessageSchema,
  CreateConversationRecipientSchema,
  DeleteConversationRecipientSchema,
} from "./conversationsSchema";

export default async function conversations(
  fastify: FastifyTypebox,
  options: ControllerOptions
) {
  const { db } = options;

  fastify.get(
    "/",
    {
      preHandler: authentication(db),
      schema: GetConversationsSchema,
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
      preHandler: authentication(db),
      schema: CreateConversationSchema,
    },
    async (request) => {
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

      const conversation: TConversation = await db
        .transaction()
        .execute(async (trx) => {
          const conversationParams: InsertConversationParams = {
            createdBy: userId,
            title,
          };

          const conversation = await insertConversation(
            trx,
            conversationParams
          );

          const recipientsParams: InsertRecipientsParams = {
            conversationId: conversation.id,
            recipientIds: [userId, ...sanitisedRecipientIds],
          };

          const recipients = await insertRecipients(trx, recipientsParams);

          return {
            ...conversation,
            recipients: recipients.filter(
              (recipient) => recipient.id !== userId
            ),
            messages: [],
          };
        });

      return conversation;
    }
  );

  fastify.post(
    "/:conversationId/messages",
    {
      preHandler: authentication(db),
      schema: CreateConversationMessageSchema,
    },
    async (request) => {
      const { userId } = request.token;
      const { conversationId } = request.params;
      const { content } = request.body;

      if (!(await isExistingConversation(db, conversationId))) {
        throw new BadRequestError(
          "ConversationNotFound",
          "conversation with id 'conversationId' not found"
        );
      }

      if (!(await isRecipientInConversation(db, userId, conversationId))) {
        throw new BadRequestError(
          "UserNotConversationRecipient",
          "user must be recipient of conversation"
        );
      }

      const params: InsertMessageParams = {
        conversationId,
        createdBy: userId,
        content: content.trim(),
      };

      return await insertMessage(db, params);
    }
  );

  fastify.post(
    "/:conversationId/recipients",
    {
      preHandler: authentication(db),
      schema: CreateConversationRecipientSchema,
    },
    async (request) => {
      const { conversationId } = request.params;
      const { recipientId } = request.body;

      if (!(await isExistingConversation(db, conversationId))) {
        throw new BadRequestError(
          "ConversationNotFound",
          "conversation with id 'conversationId' not found"
        );
      }

      if (!(await isExistingUser(db, recipientId))) {
        throw new BadRequestError(
          "RecipientNotFound",
          `user with id 'recipientId' not found`
        );
      }

      if (await isRecipientInConversation(db, recipientId, conversationId)) {
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

      return recipient;
    }
  );

  fastify.delete(
    "/:conversationId/recipients",
    {
      preHandler: authentication(db),
      schema: DeleteConversationRecipientSchema,
    },
    async (request, reply) => {
      const { conversationId } = request.params;
      const { recipientId } = request.body;

      if (!(await isExistingConversation(db, conversationId))) {
        throw new BadRequestError(
          "ConversationNotFound",
          "conversation with id 'conversationId' not found"
        );
      }

      if (!(await isExistingUser(db, recipientId))) {
        throw new BadRequestError(
          "RecipientNotFound",
          `user with id 'recipientId' not found`
        );
      }

      if (!(await isRecipientInConversation(db, recipientId, conversationId))) {
        throw new BadRequestError(
          "RecipientNotConversationMember",
          "user with id 'recipientId' must be recipient of conversation"
        );
      }

      const recipients = await findRecipientsByConversationId(
        db,
        conversationId
      );

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

      reply.code(204);
    }
  );
}
