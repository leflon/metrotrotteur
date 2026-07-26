import type {
  PlayableTrips,
  RawPlayableTrip,
  RawStop,
} from "@/types/PlayableTrips";
import { Database } from "bun:sqlite";

const db = new Database("data/gtfs.db");

console.log(
  "◆ Fetching playable trips and their sequences. Might take some time. ◆",
);

const rawTrips = db
  .query("SELECT * FROM PlayableTrips")
  .all() as RawPlayableTrip[];

const tripSequenceQuery = db.query(`
	SELECT st.stop_sequence, st.stop_id, s.stop_name, s.stop_lon, s.stop_lat FROM StopTimes st 
	JOIN Stops s ON s.stop_id = st.stop_id
	WHERE trip_id = ?
`);

const N = rawTrips.length;
let i = 1;
export const PLAYABLE_TRIPS = rawTrips.reduce((acc, curr) => {
  console.log(`${i++}/${N}: ${curr.route_long_name} - ${curr.destination}`);
  const routeDocument = acc[curr.route_id] ?? {
    routeId: curr.route_id,
    routeName: curr.route_long_name,
    routeColor: curr.route_color,
    routeTextColor: curr.route_text_color,
    routePicto: curr.picto,
    trips: [],
  };

  const stops = (tripSequenceQuery.all(curr.trip_id) as RawStop[])
    .sort((a, b) => parseInt(a.stop_sequence) - parseInt(b.stop_sequence))
    .map((stop) => ({
      stopId: stop.stop_id,
      stopName: stop.stop_name,
      longitude: parseFloat(stop.stop_lon),
      latitute: parseFloat(stop.stop_lat),
    }));

  routeDocument.trips.push({
    tripId: curr.trip_id,
    destination: curr.destination,
    stops,
  });

  return { ...acc, [curr.route_id]: routeDocument };
}, {} as PlayableTrips);

console.log("◆ Done ◆");
