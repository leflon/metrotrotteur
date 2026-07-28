import type { GameRoute } from "@metroclavier/shared";

export type IDFMGeoJSONFeature = {
    type: 'Feature';
    geometry: {
        type: 'LineString';
        coordinates: number[][];
    };
    properties: {
      from: string;
      to: string;
      routeId: string;
      routeName: string;
      routeColor: string;
    };
}