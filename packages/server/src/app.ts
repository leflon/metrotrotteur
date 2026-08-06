import { Hono } from "hono";
import { cors } from "hono/cors";
import { GAME_ROUTES, GAME_TRIPS } from "./lib/db";
import { MAP_GEOJSON } from "./lib/map";
import MultiplayerRoom from "./lib/MultiplayerRoom";
import { USER_STORE } from "./socket";
import type { GameParams, GameStats } from "@metroclavier/shared";

const app = new Hono();

app.use("*", cors());

app.get("/routes", (c) => c.json(GAME_ROUTES));

app.get("/trip/:id", (c) => {
  const trip = GAME_TRIPS[c.req.param("id")];
  if (!trip) return c.notFound();
  return c.json(trip);
});
app.get("/map.json", (c) => c.json(MAP_GEOJSON));

app.post("/send-game", async (c) => {
  const {
    params,
    stats,
    reason,
  }: { params: GameParams; stats: GameStats; reason: string } =
    await c.req.json();

  const route = GAME_TRIPS[params.trip]?.route;

  const title = 'Nouvelle partie !';
  let body = '';
  body += `**${reason}**\n\n`;
  if (params.rules.easy) body += 'Mode facile\n';
  for (const stop of stats.visitedStops) {
    body += `**${stop.stop.name}** (Ligne ${stop.route.name}) - ${stop.duration}ms\n`;
  }
  const embed = {
		title,
		description: body,
		color: 0x4cc0ae,
		footer: {
			text: 'Metro Trotteur'
		},
    thumbnail: {
        url: route?.picto
		},
		timestamp: new Date().toISOString()
  };
  try {
    await fetch(process.env.DISCORD_HOOK_URL!, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				embeds: [embed]
			})
		});
    c.status(200);
	} catch (e: any) {
		console.error(e);
    c.status(500);
		c.text(e.message || 'Something unknown went wrong.');
	}
});

app.get("/multi/rooms", (c) => {
  const roomsArr = Object.values(MultiplayerRoom.ROOMS).map((r) => r.toJSON());

  return c.json(roomsArr);
});

app.post("/multi/create-room", (c) => {
  const room = MultiplayerRoom.create();
  USER_STORE.set(room.id, new Map());
  return c.json({ roomId: room.id });
});

export default app;
