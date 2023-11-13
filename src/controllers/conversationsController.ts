import { FastifyTypebox, ControllerOptions, ServerEvent } from "../types";
import authentication from "../hooks/authenticationHook";

import { TConversationWithRecipientsAndLatestMessage } from "../schema";
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
  updateConversation,
  UpdateConversationParams,
} from "../stores";
import {
  GetConversationsSchema,
  CreateConversationSchema,
  UpdateConversationSchema,
  GetConversationMessagesSchema,
  CreateConversationMessageSchema,
  CreateConversationRecipientSchema,
  DeleteConversationRecipientSchema,
} from "./conversationsSchema";

export interface ConversationsControllerOptions extends ControllerOptions {
  dispatchServerEvent: (recipientIds: string[], event: ServerEvent) => void;
}

export default async function conversationsController(
  fastify: FastifyTypebox,
  options: ConversationsControllerOptions
) {
  const { db, dispatchServerEvent } = options;

  fastify.get(
    "/",
    {
      schema: GetConversationsSchema,
      onRequest: authentication(db),
    },
    async (request) => {
      const { userId } = request.token;

      const conversations: TConversationWithRecipientsAndLatestMessage[] = [];

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
          "Conversation must have at least 2 unique recipients."
        );
      }

      if (sanitisedRecipientIds.length === 1 && title) {
        throw new BadRequestError(
          "CannotSetDirectConversationTitle",
          "Cannot set the title for a direct conversation."
        );
      }

      const users = await findUsersByUserIds(db, sanitisedRecipientIds);

      if (users.length !== sanitisedRecipientIds.length) {
        throw new BadRequestError(
          "UserNotFound",
          `User from '${sanitisedRecipientIds.join(",")}' not found.`
        );
      }

      // should not be able to create duplicate direct conversations with only 2 recipients
      if (
        sanitisedRecipientIds.length === 1 &&
        (await isExistingConversationWithRecipientIds(db, [
          userId,
          ...sanitisedRecipientIds,
        ]))
      ) {
        throw new BadRequestError(
          "ExistingDirectConversation",
          `Direct conversation between user and '${sanitisedRecipientIds[0]}' already exists.`
        );
      }

      const conversation = await db
        .transaction()
        .execute<TConversationWithRecipientsAndLatestMessage>(async (trx) => {
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
            latestMessage: null,
            recipients: recipients.filter(
              (recipient) => recipient.id !== userId
            ),
          };
        });

      reply.code(201);

      dispatchServerEvent(sanitisedRecipientIds, {
        type: "conversation/created",
        payload: conversation,
      });

      return conversation;
    }
  );

  fastify.patch(
    "/:conversationId",
    {
      schema: UpdateConversationSchema,
      onRequest: authentication(db),
    },
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

      if (!isRecipientInConversation(recipients, userId)) {
        throw new BadRequestError(
          "UserNotConversationRecipient",
          "User must be recipient of conversation."
        );
      }

      if (recipients.length === 2) {
        throw new BadRequestError(
          "CannotSetDirectConversationTitle",
          "Cannot set the title for a direct conversation."
        );
      }

      const params: UpdateConversationParams = {
        conversationId,
        title,
      };

      const conversation = await updateConversation(db, params);

      const eventRecipientIds = recipients
        .map((recipient) => recipient.id)
        .filter((recipientId) => recipientId !== userId);

      dispatchServerEvent(eventRecipientIds, {
        type: "conversation/updated",
        payload: conversation,
      });

      return conversation;
    }
  );

  fastify.get(
    "/:conversationId/messages",
    {
      schema: GetConversationMessagesSchema,
      onRequest: authentication(db),
    },
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

      if (!isRecipientInConversation(recipients, userId)) {
        throw new BadRequestError(
          "UserNotConversationRecipient",
          "User must be recipient of conversation."
        );
      }

      return await findMessagesByConversationId(db, conversationId);
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
          `Conversation with id '${conversationId}' not found.`
        );
      }

      const recipients = await findRecipientsByConversationId(
        db,
        conversationId
      );

      if (!isRecipientInConversation(recipients, userId)) {
        throw new BadRequestError(
          "UserNotConversationRecipient",
          "User must be recipient of conversation."
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

      dispatchServerEvent(eventRecipientIds, {
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
          `Conversation with id '${conversationId}' not found.`
        );
      }

      const recipients = await findRecipientsByConversationId(
        db,
        conversationId
      );

      if (!isRecipientInConversation(recipients, userId)) {
        throw new BadRequestError(
          "UserNotConversationRecipient",
          "User must be recipient of conversation."
        );
      }

      if (recipients.length === 2) {
        throw new BadRequestError(
          "CannotCreateGroupConversation",
          "Cannot create a group conversation from a direct conversation."
        );
      }

      if (isRecipientInConversation(recipients, recipientId)) {
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

      const params: InsertRecipientsParams = {
        conversationId,
        recipientIds: [recipientId],
      };

      const [recipient] = await insertRecipients(db, params);

      reply.code(201);

      const eventRecipientIds = recipients
        .map((recipient) => recipient.id)
        .filter((recipientId) => recipientId !== userId);

      dispatchServerEvent(eventRecipientIds, {
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
    async (request, reply) => {
      const { userId } = request.token;
      const { conversationId } = request.params;
      const { recipientId } = request.body;

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

      if (!isRecipientInConversation(recipients, userId)) {
        throw new BadRequestError(
          "UserNotConversationRecipient",
          "User must be recipient of conversation."
        );
      }

      if (recipients.length === 2) {
        throw new BadRequestError(
          "MinimumRecipientsRequired",
          "Cannot remove recipients from a direct conversation."
        );
      }

      if (recipients.length === 3) {
        throw new BadRequestError(
          "CannotCreateDirectConversation",
          "Cannot create a direct conversation from a group conversation."
        );
      }

      if (!isRecipientInConversation(recipients, recipientId)) {
        throw new BadRequestError(
          "UserNotConversationRecipient",
          `User with id '${recipientId}' must be recipient of conversation.`
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

      const recipient = recipients.find(
        (recipient) => recipient.id === recipientId
      )!;

      dispatchServerEvent(eventRecipientIds, {
        type: "recipient/removed",
        payload: recipient,
      });

      reply.code(204);
    }
  );
}
