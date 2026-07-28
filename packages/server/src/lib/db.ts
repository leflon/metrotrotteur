import type { RawPlayableTrip, RawTransfer, RawTripStops } from "@/types/Database";
import type { GameRoute, GameRoutes, GameTransfer, GameTrip } from "@metroclavier/shared";
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

const stopsQuery = db.query(`
SELECT st.stop_sequence,
       COALESCE(p.stop_id,
       st.stop_id) AS station_id,
       s.stop_name,
       COALESCE(p.stop_lon,
       s.stop_lon) AS stop_lon,
       COALESCE(p.stop_lat,
       s.stop_lat) AS stop_lat
FROM StopTimes st
JOIN Stops s
  ON s.stop_id = st.stop_id
JOIN Stops p
  ON s.parent_station = p.stop_id
WHERE trip_id = ?
`);

const transfersQuery = db.query(`
  SELECT *
  FROM StopTransfers
  WHERE trips LIKE ?
`);

export const GAME_TRIPS: Record<string, GameTrip> = {};

for (const route of Object.values(GAME_ROUTES)) {
  const routeWithoutTrips: Partial<GameRoute> = structuredClone(route);
  delete routeWithoutTrips.trips;
  for (const trip of route.trips) {
    const rawStops = stopsQuery.all(trip.id) as RawTripStops[];
    const rawTransfers = transfersQuery.all(`%${trip.id}%`) as RawTransfer[];
    const transfers = rawStops.map(stop => {
      const transferRow = rawTransfers.find(t => t.station_id === stop.station_id);
      if (!transferRow) return [];
      const splitTrips = transferRow.trips.split(',').map(t => t.trim());
      const splitDestinations = transferRow.destinations.split(',').map(t => t.trim());
      const splitRoutes = transferRow.routes.split(',').map(t => t.trim());
      const splitNextStops = transferRow.next_stops.split(',').map(t => t.trim());

      const cur: GameTransfer[] = [];
      for (let i = 0; i < splitTrips.length; i++) {
        const r = splitRoutes[i]!;
        const transferRoute = structuredClone(GAME_ROUTES[r]) as Partial<GameRoute>;
        delete transferRoute.trips;
        cur.push({
          route: transferRoute as GameRoute,
          trip: splitTrips[i]!,
          destination: splitDestinations[i]!,
          nextStop: splitNextStops[i]!,
        });
      }
    return cur;
    });
    const gameTrip: GameTrip = {
      id: trip.id,
      destination: trip.destination,
      route: routeWithoutTrips as GameRoute,
      stops: rawStops.map((stop) => ({
        id: stop.station_id,
        name: stop.stop_name,
        longitude: parseFloat(stop.stop_lon),
        latitude: parseFloat(stop.stop_lat),
      })),
      transfers
    };
    GAME_TRIPS[trip.id] = gameTrip;
  }
}

console.timeEnd("Stops");
