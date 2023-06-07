import { FastifyTypebox, ControllerOptions } from "../types";
import authentication from "../hooks/authentication";

import config from "../config";
import { TConversation } from "../schema";
import {
  BadRequestError,
  removeDuplicates,
  toConversationSchema,
  toMessageSchema,
  toUserSchema,
} from "../util";
import {
  findConversationsByUserId,
  insertConversation,
  RecipientNotFoundError,
  findRecipientsByConversationId,
  isRecipientInConversation,
  insertRecipients,
  findMessagesByConversationId,
  MessageLengthExceededError,
  insertMessage,
  deleteRecipient,
} from "../stores";
import {
  GetConversationsSchema,
  CreateConversationsSchema,
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
        const conversationId = conversation.conversation_id;

        const messages = await findMessagesByConversationId(db, conversationId);
        const recipients = await findRecipientsByConversationId(
          db,
          conversationId,
          userId
        );

        conversations.push(
          toConversationSchema(conversation, recipients, messages)
        );
      }

      return conversations;
    }
  );

  fastify.post(
    "/",
    {
      preHandler: authentication(db),
      schema: CreateConversationsSchema,
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

      if (sanitisedRecipientIds.length > config.maxConversationRecipients) {
        throw new BadRequestError(
          "MaximumRecipientsExceeded",
          `conversation must have less than '${config.maxConversationRecipients}' recipients`
        );
      }

      const conversation = await db
        .transaction()
        .execute<TConversation>(async (trx) => {
          const conversation = await insertConversation(trx, {
            createdBy: userId,
            title,
          });

          const recipients = await insertRecipients(trx, {
            conversationId: conversation.conversation_id,
            recipientIds: [userId, ...sanitisedRecipientIds],
          });

          return toConversationSchema(
            conversation,
            recipients.filter((recipient) => recipient.user_id !== userId), // remove current user
            []
          );
        })
        .catch((error) => {
          if (error instanceof RecipientNotFoundError) {
            throw new BadRequestError(
              "RecipientNotFound",
              "recipient of 'recipientIds' not found"
            );
          }

          throw error;
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
      const { conversationId } = request.params;
      const { createdBy, content } = request.body;

      const trimmedContent = content.trim();

      if (trimmedContent === "") {
        throw new BadRequestError(
          "MinimumLengthRequired",
          "message 'content' cannot be empty or whitespace"
        );
      }

      if (!(await isRecipientInConversation(db, createdBy, conversationId))) {
        throw new BadRequestError(
          "CreatedByNotConversationRecipient",
          "'createdBy' & 'conversationId' must exist and 'createdBy' must be recipient of conversation"
        );
      }

      const params = {
        conversationId,
        createdBy,
        content: trimmedContent,
      };

      const message = await insertMessage(db, params).catch((error) => {
        if (error instanceof MessageLengthExceededError) {
          throw new BadRequestError(
            "MaximumLengthExceeded",
            "message 'content' too long"
          );
        }

        throw error;
      });

      return toMessageSchema(message);
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

      if (await isRecipientInConversation(db, recipientId, conversationId)) {
        throw new BadRequestError(
          "RecipientAlreadyConversationMember",
          "'recipientId' & 'conversationId' must exist and 'recipientId' must not be recipient of conversation"
        );
      }

      const params = {
        conversationId,
        recipientIds: [recipientId],
      };

      const [recipient] = await insertRecipients(db, params).catch((error) => {
        if (error instanceof RecipientNotFoundError) {
          throw new BadRequestError(
            "RecipientNotFound",
            "recipient of 'recipientId' not found"
          );
        }

        throw error;
      });

      return toUserSchema(recipient);
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

      if (!(await isRecipientInConversation(db, recipientId, conversationId))) {
        throw new BadRequestError(
          "RecipientNotConversationMember",
          "'recipientId' & 'conversationId' must exist and 'recipientId' must be recipient of conversation"
        );
      }

      const params = { conversationId, recipientId };

      await deleteRecipient(db, params);

      reply.code(204);
    }
  );
}
