import type { IDFMGeoJSONFeature } from "@/types/GeoJSON";
import { GAME_TRIPS } from "./db";


console.log('-- Generating Map GeoJSON --')
console.time('Map');
const keyGen = (id1: string, id2: string) => {
  const [min, max] = [id1, id2].sort();
  return `${min}-${max}`;
}

const features: Record<string, IDFMGeoJSONFeature> = {};

for (const trip of Object.values(GAME_TRIPS)) {
  for (let i = 0; i < trip.stops.length - 1; i++) {
    const stop1 = trip.stops[i]!;
    const stop2 = trip.stops[i + 1]!;
    const key = keyGen(stop1.id, stop2.id);
    if (key in features) continue;
    features[key] = {
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
  features: Object.values(features),
}

console.timeEnd('Map');