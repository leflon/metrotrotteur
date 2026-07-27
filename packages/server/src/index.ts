import { serve } from "bun";
import { GAME_ROUTES, GAME_TRIPS } from "./lib/db";
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};
function withCors(res: Response) {
  const withHeaders = res.clone() as typeof res;
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    withHeaders.headers.set(key, value);
  }
  return withHeaders;
}

const server = serve({
  routes: {
    "/routes": () => withCors(Response.json(GAME_ROUTES)),
    "/trip/:id": (req) => withCors(Response.json(GAME_TRIPS[req.params.id])),
    "/map.json": () => withCors(new Response(Bun.file("data/map.json"))),
  },
});

console.log(`-- Server running at ${server.url} --`);