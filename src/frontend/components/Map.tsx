import "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  GeoJSON,
} from "react-leaflet";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

export default function Map() {
  const [map, setMap] = useState(null);
  const { data, isPending, error } = useQuery({
    queryKey: ["geojson"],
    queryFn: () => fetch("/map.json").then((r) => r.json()),
  });
  return (
    <div className="map">
      <MapContainer
        center={[48.866667, 2.333333]}
        zoom={13}
        whenCreated={setMap}
      >
        <TileLayer
          attribution="Carto"
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {data && (
          <GeoJSON
            data={data}
            style={(feature) => ({
              weight: 4,
              color: "#" + feature!.properties.colourweb_hexa,
              lineJoin: "round",
              opacity: feature!.properties.mode !== "METRO" ? 0 : 1,
            })}
          />
        )}
      </MapContainer>
    </div>
  );
}
