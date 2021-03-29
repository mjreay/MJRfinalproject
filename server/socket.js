// import { io } from "socket.io-client";
// import { addNewChatMessage } from "./actions";

export let socket;

export const init = (store) => {
    if (!socket) {
        socket = io.connect();

        socket.on("sending back to client", (payload) => {
            console.log("sending back to client in sockets.js", payload);
            store.dispatch(addNewChatMessage(payload));
        });

        // socket.on("chatMessages", (msgs) => store.dispatch(chatMessages(msgs)));

        // socket.on("chatMessage", (msg) => store.dispatch(chatMessage(msg)));
    }
};
