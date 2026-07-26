<script setup lang="ts">
import "leaflet/dist/leaflet.css";
import * as L from "leaflet";
import { onMounted, ref, watch } from "vue";
import type { PlayableTrips } from "metroclavier-server/src/types/PlayableTrips";

const DEFAULT_CENTER = [48.866667, 2.333333] as [number, number];
const DEFAULT_ZOOM = 12;

const props = defineProps<{
  stops: PlayableTrips[string]["trips"][number]["stops"];
  stopsColor: string;
  focusedStopIndex: number;
}>();

const map = ref<L.Map | null>();
const linesLayer = ref<L.GeoJSON | null>(null);
const stopsLayer = ref<L.Layer | null>(null);

onMounted(async () => {
  map.value = L.map("game-map");
  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
  ).addTo(map.value);
  map.value.setZoom(DEFAULT_ZOOM);
  map.value.setView(DEFAULT_CENTER);
  const data = await (
    await fetch(`${import.meta.env.VITE_PUBLIC_API_URL}/map.json`)
  ).json();
  const geojson = L.geoJSON(data, {
    style(feature) {
      return {
        opacity: feature.properties.mode === "METRO" ? 1 : 0,
        color: "#" + feature.properties.colourweb_hexa,
      };
    },
  }).addTo(map.value);
  linesLayer.value = geojson;
});

watch(
  () => props.stops,
  (stops) => {
    if (!map.value) return;
    if (stopsLayer.value) {
      stopsLayer.value.remove();
    }
    const markers: L.CircleMarker[] = [];
    for (const stop of stops) {
      const marker = L.circleMarker([stop.latitute, stop.longitude], {
        radius: 6,
        fillColor: "#" + props.stopsColor,
        fillOpacity: 1,
        stroke: false,
      });
      markers.push(marker);
    }
    stopsLayer.value = L.layerGroup(markers).addTo(map.value);
  },
);
watch(
  () => props.focusedStopIndex,
  (index) => {
    if (!map.value) return;
    if (index === -1) {
      map.value.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM, { duration: 1.5 });
    }
    const stop = props.stops[index];
    if (!stop) return;
    map.value.flyTo([stop.latitute, stop.longitude], 14, { duration: 0.5});
  },
);
</script>

<template>
  <div id="game-map"></div>
</template>

<style scoped>
#game-map {
  height: 100vh;
}
.debug {
  position: fixed;
  z-index: 999999;
  top: 0;
  left: 0;
  background: white;
}
</style>
