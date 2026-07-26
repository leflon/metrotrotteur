export type RawPlayableTrip = {
  trip_id: string;
  route_id: string;
  route_long_name: string;
  destination: string;
  route_color: string;
  route_text_color: string;
  picto: string;
};

export type RawStop = {
  stop_sequence: string;
  stop_id: string;
  stop_name: string;
  stop_lon: string;
  stop_lat: string;
};

export type PlayableTrips = Record<
  string,
  {
    routeId: string; // Matches the key of this entry
    routeName: string;
    routeColor: string;
    routeTextColor: string;
    routePicto: string;
    trips: Array<{
      tripId: string;
      destination: string;
      stops: Array<{
        stopId: string;
        stopName: string;
        longitude: number;
        latitute: number;
      }>;
    }>;
  }
>;
