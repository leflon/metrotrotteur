import { serve } from "bun";
import index from "./frontend/index.html";
import { Database } from "bun:sqlite";

const db = new Database("data/idfm.db");

type Line = {
  name: string;
  mode: string;
  picto: string;
  color: string;
  text_color: string;
};

const LINES = db
  .query("SELECT * FROM Lines WHERE mode = 'metro'")
  .all() as Line[];

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,
    "/lines": () => Response.json(LINES),
    "/map.json": Bun.file("data/map.json"),
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
