import type { DataDrivenPropertyValueSpecification } from "maplibre-gl";

/* Home of complex MapLibre data driven expressions */

export const STOP_CIRCLE_COLOR_EXPRESSION: DataDrivenPropertyValueSpecification<string> = [
  "case",
  ["==", ["length", ["get", "routeIds"]], 1],
  ["concat", "#", ["at", 0, ["get", "routeColors"]]],
  "white"
];

export const STOP_CIRCLE_STROKE_WIDTH_EXPRESSION: DataDrivenPropertyValueSpecification<number> = [
  "case",
  [">", ["length", ["get", "routeIds"]], 1],
  4,
  0
];

export const LINE_OPACITY_EXPRESSION: (focusedRoute: string) => DataDrivenPropertyValueSpecification<number> = f => [
  "case",
  ["==", ["get", "routeId"], f],
  1,
  ["case",
    ["boolean", ["get", "hasOverlap"]],
    0,
    0.3
  ]
];

export const STOP_OPACITY_EXPRESSION: (focusedRoute: string) => DataDrivenPropertyValueSpecification<number> = f => [
  "case",
  ["in", f, ["get", "routeIds"]],
  1,
  0.3
];