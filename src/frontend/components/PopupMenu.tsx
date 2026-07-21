import { useQuery } from "@tanstack/react-query";

export default function PopupMenu() {
  const { data } = useQuery({
    queryKey: ["lines"],
    queryFn: () => fetch("/lines").then((r) => r.json()),
  });

  return <div>{JSON.stringify(data)}</div>;
}
