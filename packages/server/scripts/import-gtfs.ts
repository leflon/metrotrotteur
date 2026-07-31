
import { Database } from "bun:sqlite";

const db = new Database("data/gtfs.db");

function datatype(column: string): string {
  // Only column for which we actually need integer (used for MIN/MAX)
  // Other number-like columns can be converted if needed in the app,
  // but it's not needed at the SQL level.
  return column === 'stop_sequence' ? 'INTEGER' : 'TEXT';
}

async function importFile(dataset: string, table: string, separator: string = ',') {
  const file = Bun.file(`data/${dataset}`);
  const content = await file.text();
  const lines = content.split("\n");
  const header = lines[0]!.split(separator);

  db.query(`DROP TABLE IF EXISTS ${table}`).run();

  let create = `CREATE TABLE ${table} (${header.map((h) => `${h} ${datatype(h)}`).join(", ")})`;
  db.query(create).run();

  let insert = `INSERT INTO ${table} VALUES (${header.map(() => '?').join(", ")})`;
  db.transaction(() => {
    const stmt = db.query(insert);
    let i = 1;
    const N = lines.length - 1;
    console.time(`Importing ${dataset}`);
    for (const line of lines.slice(1)) {
      try {
        stmt.run(...line.split(separator));
      } catch (e) {
        // Fine
      }
    }
    console.timeEnd(`Importing ${dataset}`);
  })();
}

await importFile("stops.txt", "Stops");
await importFile("trips.txt", "Trips");
await importFile("routes.txt", "Routes");
await importFile("referentiel-des-lignes.csv", "RoutesReferential", ';');
console.log('-- Importing stop_times (takes a while) --');
await importFile("stop_times.txt", "StopTimes");
await importFile("shapes.txt", "Shapes");