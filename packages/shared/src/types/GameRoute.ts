export type GameRoutes = Record<string, GameRoute>

export type GameRoute = {
  id: string;
  name: string;
  color: string;
  textColor: string;
  picto: string;
  trips: Array<{
    id: string;
    destination: string;
  }>;
}