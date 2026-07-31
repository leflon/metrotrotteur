import type { GameRoutes } from "@metroclavier/shared";
import type { GeoJSON, GeoJsonProperties, Geometry } from "geojson";
import { reactive } from "vue";

export const resources = reactive({
  GAME_ROUTES: {} as GameRoutes,
  GAME_GEOJSON: {} as GeoJSON<Geometry, GeoJsonProperties>
});