<script setup lang="ts">
import {
    LINE_OPACITY_EXPRESSION,
    STOP_CIRCLE_COLOR_EXPRESSION,
    STOP_CIRCLE_STROKE_WIDTH_EXPRESSION,
    STOP_OPACITY_EXPRESSION,
} from "@/lib/MapLibreExpressions";
import { resources } from "@/stores/resources";
import type { GameTrip } from "@metroclavier/shared";
import { Map as MapLibre, setWorkerUrl } from "maplibre-gl";
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import "maplibre-gl/dist/maplibre-gl.css";
import { onMounted, watch } from "vue";

setWorkerUrl(workerUrl);

const DEFAULT_CENTER = [2.333333, 48.859667] as [number, number];
const DEFAULT_ZOOM = 12;

const props = defineProps<{
  trip: GameTrip;
  focusedStopIndex: number;
  angle: number;
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
    interactive: false
  });

  map.on("load", () => {
    map.addSource("map-geojson", {
      type: "geojson",
      data: resources.GAME_GEOJSON,
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
      minZoom: 15
    });
  },
  { immediate: true },
);
</script>

<template>
  <div class='map-container'>
    <div id="game-map"></div>
  </div>
</template>

<style>
.map-container,
#game-map {
  height: 100%;
}

.cute-train {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  & img {
    transition: transform .3s ease 0.8s;
  }
}


</style>
