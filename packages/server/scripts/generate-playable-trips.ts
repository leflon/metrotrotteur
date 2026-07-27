/*
 *********************
 * generate-playable-trips
 * --
 * This script generates the `PlayableTrips` table, which is an expensive operation.
 * This table holds the Trip Id of each playable trip in the game, with the useful data for it
 * (route id, route pictogram, headsign, etc.)
 *
 *********************
 */

/*
 * Ensure you imported GTFS data into gtfs.db using SQLite's CSV mode:
 *  - trips.csv: Trips
 *  - routes.csv: Routes
 *  - stop_times.csv: StopTimes
 *  - stops.csv: Stops
 *
 * And also import the "Référentiel des Lignes" dataset to get pictograms:
 *  - referentiel-des-lignes.csv: RoutesReferential
 */

import { Database } from "bun:sqlite";

const db = new Database("data/gtfs.db");

console.log("◆ Dropping previous tables ◆");
db.run("DROP TABLE IF EXISTS PlayableTrips");
db.run("DROP TABLE IF EXISTS StopTransfers");

console.log("◆ Generating playable trips... ◆");
db.run(`
CREATE TABLE PlayableTrips AS
SELECT oo.trip_id AS trip_id,
       oo.route_id,
       oo.route_long_name,
       oo.trip_headsign AS destination,
       oo.route_color,
       oo.route_text_color,
       rr.picto
FROM (
  SELECT *,
         ROW_NUMBER() OVER(PARTITION BY o.route_id,
         o.direction_id ORDER BY o.stop_count DESC) AS n
  FROM (
    SELECT r.route_id,
           r.route_long_name,
           t.trip_id,
           t.trip_headsign,
           t.direction_id,
           r.route_color,
           r.route_text_color,
           COUNT(st.stop_id) AS stop_count
    FROM Trips t
    JOIN Routes r
      ON t.route_id = r.route_id
    JOIN StopTimes st
      ON st.trip_id = t.trip_id
    WHERE route_type = 1
    GROUP BY t.trip_id
    ORDER BY stop_count DESC
  ) AS o
  GROUP BY o.route_id, o.trip_headsign
  ORDER BY route_long_name
) AS oo
JOIN RoutesReferential rr
  ON rr.id_line = substr(oo.route_id, 6)
WHERE oo.n = 1
  OR (oo.route_long_name IN ('7', '13') AND oo.n = 2 AND oo.direction_id = 1)
ORDER BY oo.route_long_name`);

console.log("◆ Generating Stop Transfers ◆");
db.run(`
CREATE TABLE StopTransfers AS
SELECT COALESCE(s.parent_station,
       s.stop_id) AS station_id,
       s.stop_name,
       GROUP_CONCAT(pt.trip_id) AS trips,
       GROUP_CONCAT(pt.destination) as destinations,
       GROUP_CONCAT(r.route_id) as routes
FROM PlayableTrips pt
JOIN StopTimes st
  ON st.trip_id = pt.trip_id
JOIN Stops s
  ON s.stop_id = st.stop_id
JOIN Routes r ON r.route_id = pt.route_id
GROUP BY station_id
`)

console.log("◆ Done ◆");

const result = db
  .query("SELECT route_id, destination FROM PlayableTrips")
  .all();
console.table(result);
