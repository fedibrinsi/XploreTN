import http from "http";
import app from "./app";
import { initSocket } from "./socket";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
initSocket(server); // ← Socket.io s'attache au même serveur HTTP

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
