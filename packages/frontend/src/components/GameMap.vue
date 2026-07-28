<script setup lang="ts">
import "maplibre-gl/dist/maplibre-gl.css";
import { onMounted, watch } from "vue";
import {
  GeoJSONSource,
  Map as MapLibre,
  type DataDrivenPropertyValueSpecification,
} from "maplibre-gl";
import type { GameTrip } from "@metroclavier/shared";

const DEFAULT_CENTER = [2.333333, 48.859667] as [number, number];
const DEFAULT_ZOOM = 12;

const props = defineProps<{
  lines: GeoJSONSource;
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
    interactive: false,
  });
  
  map.on("load", () => {
    map.addSource("lines-geojson", {
      type: "geojson",
      data: props.lines,
    });
    map.addLayer({
      id: "lines-layer",
      type: "line",
      source: "lines-geojson",
      paint: {
        "line-color": ["concat", "#", ["get", "colourweb_hexa"]],
        "line-width": 2,
      },
      filter: ["==", ["get", "mode"], "METRO"],
    });
    resolveMapReady();
  });
});

watch(
  () => props.trip?.stops,
  async (stops) => {
    await mapLoaded();
    
    const trip = props.trip;
    stops = stops ?? [];
    const geojson = {
      type: "FeatureCollection",
      features: stops.map((stop, i) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [stop.longitude, stop.latitude],
        },
        properties: { index: i },
      })),
    };
    if (map.getSource("stops-geojson"))
      (map.getSource("stops-geojson") as GeoJSONSource).setData(geojson);
    else {
      map.addSource("stops-geojson", { type: "geojson", data: geojson });
      map.addLayer({
        id: "stops-layer",
        type: "circle",
        source: "stops-geojson",
        paint: {
          "circle-radius": 4,
          "circle-color": "#" + trip?.route.color,
          "circle-stroke-width": 4,
          "circle-stroke-color": "#" + trip?.route.color,
        },
      });
    }
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
      zoom: 14,
      essential: true,
      duration: 1000,
      easing,
    });
    const _case = ["case", ["==", ["get", "index"], index]];
    const color = "#" + trip.route.color;
    map.setPaintProperty("stops-layer", "circle-radius", [
      ..._case,
      8,
      4,
    ] as DataDrivenPropertyValueSpecification<number>);
    map.setPaintProperty("stops-layer", "circle-color", [
      ..._case,
      "white",
      color,
    ] as DataDrivenPropertyValueSpecification<string>);
    map.setPaintProperty("stops-layer", "circle-stroke-color", [
      ..._case,
      "black",
      color,
    ] as DataDrivenPropertyValueSpecification<string>);
  }, { immediate: true }
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
