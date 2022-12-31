import { WebSocket } from "ws";

export interface ClientSocket {
    userId: string;
    socket: WebSocket;
}
