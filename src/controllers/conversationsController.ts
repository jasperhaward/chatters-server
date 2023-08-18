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
  isExistingConversationWithRecipientIds,
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
        const recipients = await findRecipientsByConversationId(
          db,
          conversation.id
        );

        conversations.push({
          ...conversation,
          recipients: recipients.filter((recipient) => recipient.id !== userId),
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

      // should not be able to create multiple 'DM' conversations with only 2 recipients
      if (
        sanitisedRecipientIds.length === 1 &&
        (await isExistingConversationWithRecipientIds(db, [
          userId,
          ...sanitisedRecipientIds,
        ]))
      ) {
        throw new BadRequestError(
          "ExistingDirectConversation",
          `direct conversation between user and 'recipientIds' already exists`
        );
      }

      const conversation = await db
        .transaction()
        .execute<TConversation>(async (trx) => {
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
          };
        });

      reply.code(201);

      sendEvent(sanitisedRecipientIds, {
        type: "conversation/created",
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
        type: "message/created",
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

      if (!isRecipientInConversation(recipients, userId)) {
        throw new BadRequestError(
          "UserNotConversationRecipient",
          "user must be recipient of conversation"
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

      if (!isRecipientInConversation(recipients, userId)) {
        throw new BadRequestError(
          "UserNotConversationRecipient",
          "user must be recipient of conversation"
        );
      }

      if (recipients.length === 2) {
        throw new BadRequestError(
          "MinimumRecipientsRequired",
          "conversation must have at least 2 recipients"
        );
      }

      // deleting a recipient from a conversations with 3 recipients will
      // create a DM conversation, of which there should be no duplicates
      if (recipients.length === 3) {
        const updatedRecipientIds = recipients
          .map((recipient) => recipient.id)
          .filter((id) => recipient.id !== id);

        if (
          await isExistingConversationWithRecipientIds(db, updatedRecipientIds)
        ) {
          throw new BadRequestError(
            "ExistingDirectConversation",
            `direct conversation between user and updated 'recipientIds' already exists`
          );
        }
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
