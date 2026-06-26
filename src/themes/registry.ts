import "server-only";
import { getEnv } from "@/src/lib/config/env";
import { defaultTheme } from "@/src/themes/default";
import { minimalTheme } from "@/src/themes/minimal";
import type { HydrotionTheme } from "@/src/themes/types";

const themes = {
  default: defaultTheme,
  minimal: minimalTheme
} satisfies Record<string, HydrotionTheme>;

export function getTheme() {
  const name = getEnv().HYDROTION_THEME;
  return themes[name as keyof typeof themes] ?? defaultTheme;
}

export function getThemeNames() {
  return Object.keys(themes);
}
