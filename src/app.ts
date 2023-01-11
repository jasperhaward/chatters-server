import express from "express";
import cors from "cors";
import crypto from "crypto";
import { WebSocketServer } from "ws";
import * as data from "./data";
import { sleep } from "./utils";
import { ClientSocket, ClientMessage, Message, Session } from "../types";

const app = express();
const port = 3001;
const clients: ClientSocket[] = [];

app.use(cors());
app.use(express.json());

app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;

    await sleep(1000);

    if (username === "Jasper Haward" && password === "password") {
        const user: Session = {
            user: {
                id: crypto.randomUUID(),
                username: "Jasper Haward",
            },
            token: crypto.randomUUID(),
        };

        return res.json(user);
    }

    res.sendStatus(401);
});

app.post("/api/conversations/:id/messages", (req, res) => {
    const { id } = req.params;
    const { content, createdById } = req.body;

    const conversation = data.conversations.find((conversation) => {
        return conversation.id === id;
    })!;

    const createdBy = data.recipients.find((recipient) => {
        return recipient.id === createdById;
    })!;

    const recipientIds = conversation.recipients.map(
        (recipient) => recipient.id
    );

    const message: Message = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        conversationId: id,
        content,
        createdBy,
    };

    for (const client of clients) {
        if (recipientIds.includes(client.userId)) {
            client.socket.send(JSON.stringify(message));
        }
    }

    res.send(message);
});

const server = app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
});

const wss = new WebSocketServer({ server });

wss.on("connection", (socket) => {
    socket.on("message", (data) => {
        const message: ClientMessage = JSON.parse(`${data}`);

        switch (message.type) {
            case "handshake":
                clients.push({
                    userId: message.payload.userId,
                    socket,
                });
                break;
        }
    });
});

export default app;
