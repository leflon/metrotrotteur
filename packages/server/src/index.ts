import app from "./app";
import { engine, io } from "./socket";
import { serve } from "bun";

serve({
  fetch(req, server) {
    const url = new URL(req.url);
    if (url.pathname === "/socket.io/") {
      console.log('socket', url.pathname);
      return engine.handleRequest(req, server);
    } else {
      console.log('app', url.pathname);
      return app.fetch(req, server);
    }
  },
  websocket: engine.handler().websocket,
});
