import type { GameRoute } from "@metroclavier/shared";

export type GeoJSONRoute = {
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
      hasOverlap: boolean;
    };
}

export type GeoJSONStop = {
    type: 'Feature';
    geometry: {
        type: 'Point';
        coordinates: number[];
    };
    properties: {
      id: string;
      name: string;
      routeIds: string[];
      routeColors: string[];
      trips: string[];
    };
}