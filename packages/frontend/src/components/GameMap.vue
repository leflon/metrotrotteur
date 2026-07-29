<script setup lang="ts">
import "maplibre-gl/dist/maplibre-gl.css";
import { onMounted, watch } from "vue";
import { GeoJSONSource, Map as MapLibre } from "maplibre-gl";
import type { GameTrip } from "@metroclavier/shared";
import {
  LINE_OPACITY_EXPRESSION,
  STOP_CIRCLE_COLOR_EXPRESSION,
  STOP_CIRCLE_STROKE_WIDTH_EXPRESSION,
  STOP_OPACITY_EXPRESSION,
} from "@/lib/MapLibreExpressions";

const DEFAULT_CENTER = [2.333333, 48.859667] as [number, number];
const DEFAULT_ZOOM = 12;

const props = defineProps<{
  geojson: GeoJSONSource;
  trip: GameTrip;
  focusedStopIndex: number;
}>();

let map: MapLibre;

let resolveMapReady: () => void;
const mapReady = new Promise<void>((resolve) => {
  resolveMapReady = resolve;
});
async function mapLoaded(): Promise<void> {
  return mapReady;
}

onMounted(async () => {
  map = new MapLibre({
    container: "game-map",
    style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
    zoom: DEFAULT_ZOOM,
    center: DEFAULT_CENTER,
    // interactive: false,
  });

  map.on("load", () => {
    map.addSource("map-geojson", {
      type: "geojson",
      data: props.geojson,
    });
    map.addLayer({
      id: "lines-layer",
      type: "line",
      source: "map-geojson",
      paint: {
        "line-color": ["concat", "#", ["get", "routeColor"]],
        "line-width": 6,
      },
    });
    map.addLayer({
      id: "stops-layer",
      type: "circle",
      source: "map-geojson",
      paint: {
        "circle-color": STOP_CIRCLE_COLOR_EXPRESSION,
        "circle-radius": 10,
        "circle-stroke-color": "black",
        "circle-stroke-width": STOP_CIRCLE_STROKE_WIDTH_EXPRESSION,
      },
    });
    resolveMapReady();
  });
});

watch(
  () => props.trip.route,
  async (route) => {
    await mapLoaded();

    map.setPaintProperty(
      "lines-layer",
      "line-opacity",
      LINE_OPACITY_EXPRESSION(route.id),
    );
    // map.setPaintProperty("stops-layer", "circle-stroke-opacity", STOP_OPACITY_EXPRESSION(route.id))
    map.setPaintProperty(
      "stops-layer",
      "circle-opacity",
      STOP_OPACITY_EXPRESSION(route.id),
    );
  },
  { immediate: true },
);

watch(
  () => props.focusedStopIndex,
  async (index) => {
    await mapLoaded();

    const trip = props.trip;

    const easing = (t: number) => {
      return t < 0.5
        ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
        : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2;
    };
    if (index === -1) {
      map.flyTo({
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        essential: true,
        duration: 1500,
        easing,
      });
    }

    const stop = trip?.stops[index];
    if (!stop || !trip) return;
    map.flyTo({
      center: [stop.longitude, stop.latitude],
      zoom: 15,
      essential: true,
      duration: 1000,
      easing,
    });
  },
  { immediate: true },
);
</script>

<template>
  <div id="game-map"></div>
</template>

<style>
#game-map {
  height: 100%;
}

path.focused {
  transform-origin: center center;
  transform-box: fill-box;
  stroke: black;
  fill: white;
  scale: 1.5;
}
</style>
