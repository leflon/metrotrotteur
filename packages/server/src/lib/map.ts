import type { GeoJSONRoute, GeoJSONStop } from "@/types/GeoJSON";
import { GAME_ROUTES, GAME_TRIPS } from "./db";
import type { GameRoute, GameStop } from "@metroclavier/shared";


console.log('-- Generating Map GeoJSON --')
console.time('Map');
const keyGen = (stop1: GameStop, stop2: GameStop, route: string) => {
  const id1 = stop1.id;
  const id2 = stop2.id;
  const [min, max] = [id1, id2].sort();
  return `${route}:${min}-${max}`;
}

const routes: Record<string, GeoJSONRoute> = {};
const stops: Record<string, GeoJSONStop> = {};

type Route = Omit<GameRoute, 'trips'>;
function featureFromStop(stop: GameStop, route: Route, trip: string): GeoJSONStop {
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [stop.longitude, stop.latitude],
    },
    properties: {
      id: stop.id,
      trips: [trip],
      name: stop.name,
      routeIds: [route.id],
      routeColors: [route.color]
    },
  }
}

for (const trip of Object.values(GAME_TRIPS)) {
  for (let i = 0; i < trip.stops.length - 1; i++) {
    const stop1 = trip.stops[i]!;
    const stop2 = trip.stops[i + 1]!;
    // Add stops
    for (const s of [stop1, stop2]) {
      const feature = stops[s.id];
      if (feature) {
        feature.properties.trips.push(trip.id);
        if (!feature.properties.routeIds.includes(trip.route.id)) {
          feature.properties.routeIds.push(trip.route.id);
          feature.properties.routeColors.push(trip.route.color);
        }
      }
      else stops[s.id] = featureFromStop(s, trip.route, trip.id);
    }

    // Add segment
    const key = keyGen(stop1, stop2, trip.route.id);
    if (key in routes) {
      console.log(key, 'already');
      continue;
    };
    routes[key] = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [stop1.longitude, stop1.latitude],
          [stop2.longitude, stop2.latitude],
        ],
      },
      properties: {
        from: stop1.id,
        to: stop2.id,
        routeId: trip.route.id,
        routeName: trip.route.name,
        routeColor: trip.route.color,
      },
    };
  }
}

export const MAP_GEOJSON = {
  type: 'FeatureCollection',
  features: [...Object.values(routes), ...Object.values(stops)],
}

console.timeEnd('Map');