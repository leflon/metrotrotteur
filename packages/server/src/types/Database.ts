export type RawPlayableTrip = {
  trip_id: string;
  route_id: string;
  route_long_name: string;
  destination: string;
  route_color: string;
  route_text_color: string;
  picto: string;
};

export type RawTripStops = {
  stop_sequence: string;
  station_id: string;
  stop_name: string;
  stop_lon: string;
  stop_lat: string;
}

export type RawTransfer = {
  station_id: string;
  stop_name: string;
  trips: string;
  destinations: string;
  routes: string;
  next_stops: string;
}