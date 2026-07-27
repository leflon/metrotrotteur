import type { RawPlayableTrip, RawTripStops } from "@/types/Database";
import type { GameRoute, GameRoutes, GameTrip } from "@metroclavier/shared";
import { Database } from "bun:sqlite";


const db = new Database("data/gtfs.db");

/**
 * Routes and Trips can be fairly expensive to fetch and format, and they are considered a static resource.
 * Hence, we eagerly load then on start to accelerate the individual requests' time.
 */

 console.log('-- Loading static resources --')

//#region Eager Loading Game Routes
console.time(
  "Trips",
);

const rawTrips = db
  .query("SELECT * FROM PlayableTrips")
  .all() as RawPlayableTrip[];

export const GAME_ROUTES: GameRoutes = rawTrips.reduce((acc, curr) => {
  const routeDocument: GameRoute = acc[curr.route_id] ?? {
    id: curr.route_id,
    name: curr.route_long_name,
    color: curr.route_color,
    textColor: curr.route_text_color,
    picto: curr.picto,
    trips: [],
  };
  routeDocument.trips.push({
    id: curr.trip_id,
    destination: curr.destination
  });
  
  
  return { ...acc, [curr.route_id]: routeDocument };
}, {} as GameRoutes);

console.timeEnd("Trips");
//#endregion Eager Loading Game Routes

//#region Eager Loading Trips
console.time("Stops");

const tripStopsQuery = db.query(`
	SELECT st.stop_sequence, st.stop_id, s.stop_name, s.stop_lon, s.stop_lat FROM StopTimes st 
	JOIN Stops s ON s.stop_id = st.stop_id
	WHERE trip_id = ?
`);

export const GAME_TRIPS: Record<string, GameTrip> = {};

for (const route of Object.values(GAME_ROUTES)) {
  const routeWithoutTrips: Partial<GameRoute> = structuredClone(route);
  delete routeWithoutTrips.trips;
  for (const trip of route.trips) {
    const data = tripStopsQuery.all(trip.id) as RawTripStops[];
    const gameTrip: GameTrip = {
      id: trip.id,
      destination: trip.destination,
      route: routeWithoutTrips as GameRoute,
      stops: data.map((stop) => ({
        id: stop.stop_id,
        name: stop.stop_name,
        longitude: parseFloat(stop.stop_lon),
        latitude: parseFloat(stop.stop_lat),
      })),
      transfers: [],
    };
    GAME_TRIPS[trip.id] = gameTrip;
  }
}

console.timeEnd("Stops");
