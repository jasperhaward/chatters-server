import { FastifyTypebox, WithDb } from "../types";
import authentication from "../hooks/authentication.hook";

import { TConversation } from "../schema";
import { toUserSchmema, toMessageSchmema } from "../util";
import {
  findConversationsByUserId,
  findRecipientsByConversationId,
  findMessagesByConversationId,
} from "../stores";
import { GetConversationsSchema } from "./conversations.schema";

export default async function auth(fastify: FastifyTypebox, options: WithDb) {
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
          conversationId
        );

        conversations.push({
          id: conversationId,
          recipients: recipients.map(toUserSchmema),
          messages: messages.map(toMessageSchmema),
        });
      }

      return conversations;
    }
  );
}
