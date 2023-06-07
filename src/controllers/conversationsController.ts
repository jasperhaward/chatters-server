import { FastifyTypebox, ControllerOptions } from "../types";
import authentication from "../hooks/authentication";

import config from "../config";
import { TConversation } from "../schema";
import {
  BadRequestError,
  removeDuplicates,
  toConversationSchema,
} from "../util";
import {
  findConversationsByUserId,
  insertConversation,
  RecipientNotFoundError,
  findRecipientsByConversationId,
  insertRecipients,
  findMessagesByConversationId,
} from "../stores";
import {
  GetConversationsSchema,
  CreateConversationsSchema,
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
}
