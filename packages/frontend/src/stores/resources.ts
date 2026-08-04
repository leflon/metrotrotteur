import type { GameRoute, GameRoutes, GameTrip } from "@metroclavier/shared";
import type { GeoJSON, GeoJsonProperties, Geometry } from "geojson";
import { reactive } from "vue";

export const resources = reactive({
  GAME_ROUTES: {} as GameRoutes,
  GAME_GEOJSON: {} as GeoJSON<Geometry, GeoJsonProperties>
});

export function getRouteFromTrip(tripId: string): GameRoute | undefined {
  return Object.values(resources.GAME_ROUTES).find(route => route.trips.some(t => t.id === tripId));
}