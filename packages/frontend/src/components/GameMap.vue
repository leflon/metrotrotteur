<script setup lang="ts">
import "leaflet/dist/leaflet.css";
import "maplibre-gl/dist/maplibre-gl.css";
import { markRaw, onMounted, ref, shallowRef, watch } from "vue";
import type { PlayableTrips } from "metroclavier-server/src/types/PlayableTrips";
import {
  GeoJSONSource,
  Map as MapLibre,
  Marker,
  type DataDrivenPropertyValueSpecification,
} from "maplibre-gl";

const DEFAULT_CENTER = [2.333333, 48.859667] as [number, number];
const DEFAULT_ZOOM = 12;

const props = defineProps<{
  stops: PlayableTrips[string]["trips"][number]["stops"];
  stopsColor: string;
  focusedStopIndex: number;
}>();

let map: MapLibre;
const stopMarkers: Marker[] = [];

onMounted(async () => {
  map = new MapLibre({
    container: "game-map",
    style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
    zoom: DEFAULT_ZOOM,
    center: DEFAULT_CENTER,
  });

  const data = await (
    await fetch(`${import.meta.env.VITE_PUBLIC_API_URL}/map.json`)
  ).json();
  map.addSource("lines-geojson", {
    type: "geojson",
    data,
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
});

watch(
  () => props.stops,
  (stops) => {
    if (!map) return;
    const geojson = {
      type: "FeatureCollection",
      features: stops.map((stop, i) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [stop.longitude, stop.latitute],
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
          "circle-color": "#" + props.stopsColor,
          "circle-stroke-width": 4,
          "circle-stroke-color": "#" + props.stopsColor,
        },
      });
    }
  },
);
watch(
  () => props.focusedStopIndex,
  (index) => {
    if (!map) return;
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
    const stop = props.stops[index];
    if (!stop) return;
    map.flyTo({
      center: [stop.longitude, stop.latitute],
      zoom: 14,
      essential: true,
      duration: 1000,
      easing,
    });
    const _case = ["case", ["==", ["get", "index"], index]];
    const color = "#" + props.stopsColor;
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
  },
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
