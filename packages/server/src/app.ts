import { Hono } from "hono";
import { cors } from "hono/cors";
import { GAME_ROUTES, GAME_TRIPS } from "./lib/db";
import { MAP_GEOJSON } from "./lib/map";
import MultiplayerRoom from "./lib/MultiplayerRoom";

const app = new Hono();

app.use("*", cors());

app.get("/routes", (c) => c.json(GAME_ROUTES));

app.get("/trip/:id", (c) => {
  const trip = GAME_TRIPS[c.req.param("id")];
  if (!trip) return c.notFound();
  return c.json(trip);
});
app.get("/map.json", (c) => c.json(MAP_GEOJSON));

app.get('/multi/rooms', (c) => {
  const roomsArr = Object.values(MultiplayerRoom.ROOMS)
    .map(r => r.toJSON());
    
  return c.json(roomsArr);
});

app.post('/multi/create-room', (c) => {
  const room = MultiplayerRoom.create();
  return c.json({roomId: room.id });
});

export default app;
