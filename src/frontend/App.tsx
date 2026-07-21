import "./index.css";
import "leaflet/dist/leaflet.css";
import Map from "./components/Map.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PopupMenu from "./components/PopupMenu.tsx";

const client = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={client}>
      <PopupMenu />
      <Map />
    </QueryClientProvider>
  );
}

export default App;
