import app from "./app";
import { engine, io } from "./socket";
import { serve } from "bun";

serve({
  fetch(req, server) {
    const url = new URL(req.url);
    if (url.pathname === "/socket.io/") {
      return engine.handleRequest(req, server);
    } else {
      return app.fetch(req, server);
    }
  },
  websocket: engine.handler().websocket,
});
