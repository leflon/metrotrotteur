import { serve, type Server } from "bun";
import { PLAYABLE_TRIPS } from "./lib/db";

type Handler = (req: Request, server: Server<any>) => Response | Promise<Response>;
type RouteValue = Handler | Partial<Record<string, Handler>>;
type Routes = Record<string, RouteValue>;

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

function withCors(routes: Routes): Routes {
  const wrapped: Routes = {};

  for (const [path, handler] of Object.entries(routes)) {
    const methods: Partial<Record<string, Handler>> =
      typeof handler === "function" ? { GET: handler } : handler;

    const wrappedMethods: Partial<Record<string, Handler>> = {
      OPTIONS: () => new Response(null, { headers: CORS_HEADERS }),
    };

    for (const [method, fn] of Object.entries(methods)) {
      if (!fn) continue;
      wrappedMethods[method] = async (req, server) => {
        const res = await fn(req, server);
        for (const [k, v] of Object.entries(CORS_HEADERS)) {
          res.headers.set(k, v);
        }
        return res;
      };
    }

    wrapped[path] = wrappedMethods;
  }

  return wrapped;
}

const server = serve({
  routes: withCors({
    "/trips": () => Response.json(PLAYABLE_TRIPS),
    "/map.json": () => new Response(Bun.file("data/map.json")),
  }),
});


export type { PlayableTrips } from "./types/PlayableTrips";