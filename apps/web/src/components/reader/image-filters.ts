import type { SettingsDto } from "../../lib/api";

export const IMAGE_FILTERS: Array<{
  key: SettingsDto["imageFilter"];
  label: string;
  color: string;
}> = [
  { key: "none", label: "Normal", color: "text-slate-300" },
  { key: "warm", label: "Cálido", color: "text-amber-300" },
  { key: "cool", label: "Frío", color: "text-cyan-300" },
  { key: "sepia", label: "Sepia", color: "text-orange-300" },
  { key: "night", label: "Noche", color: "text-indigo-300" },
  { key: "paper", label: "Papel", color: "text-stone-300" },
  { key: "high-contrast", label: "Alto contraste", color: "text-white" },
  { key: "grayscale", label: "Blanco y negro", color: "text-gray-300" },
];
