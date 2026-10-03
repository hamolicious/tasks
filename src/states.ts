import type { SettingsValue } from "@kernel";
import type { CSSProperties } from "react";

export interface TaskStateSetting {
  readonly marker: string;
  readonly label: string;
  readonly icon: string | undefined;
  readonly done: boolean;
  readonly color: string | undefined;
  readonly background: string | undefined;
  readonly bold: boolean;
  readonly italic: boolean;
  readonly underline: boolean;
  readonly strike: boolean;
}

export const TEXT_STYLES = ["bold", "italic", "underline", "strike"] as const;

export type TextStyle = (typeof TEXT_STYLES)[number];

const PLAIN = {
  color: undefined,
  background: undefined,
  bold: false,
  italic: false,
  underline: false,
  strike: false,
} as const;

export const STATES_KEY = "states";

export const RESERVED_MARKERS: readonly string[] = [" ", "x", "X"];

export const DEFAULT_STATES: readonly TaskStateSetting[] = [
  { ...PLAIN, marker: "/", label: "In progress", icon: "progress", done: false },
  { ...PLAIN, marker: "-", label: "Dropped", icon: "square-off", done: true, strike: true },
  { ...PLAIN, marker: "?", label: "Question", icon: "help-square", done: false },
];

const FALLBACK_GLYPHS: Readonly<Record<string, string>> = { "/": "◐", "-": "⊘", "?": "?" };

export const newState = (marker: string): TaskStateSetting => ({
  ...PLAIN,
  marker,
  label: "New state",
  icon: undefined,
  done: false,
});

const COLOR = /^#[0-9a-f]{6}$/i;

const colorOf = (value: unknown): string | undefined =>
  typeof value === "string" && COLOR.test(value) ? value.toLowerCase() : undefined;

export const glyphFor = (marker: string): string => FALLBACK_GLYPHS[marker] ?? marker;

const asState = (value: unknown): TaskStateSetting | undefined => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  if (typeof record.marker !== "string" || typeof record.label !== "string") return undefined;
  return {
    marker: record.marker,
    label: record.label,
    icon: typeof record.icon === "string" && record.icon !== "" ? record.icon : undefined,
    done: record.done === true,
    color: colorOf(record.color),
    background: colorOf(record.background),
    bold: record.bold === true,
    italic: record.italic === true,
    underline: record.underline === true,
    strike: record.strike === true,
  };
};

export function parseStates(value: SettingsValue | undefined): readonly TaskStateSetting[] {
  if (!Array.isArray(value)) return DEFAULT_STATES;
  return value.flatMap((line) => {
    if (typeof line !== "string") return [];
    try {
      return asState(JSON.parse(line)) ?? [];
    } catch {
      return [];
    }
  });
}

export function serializeStates(states: readonly TaskStateSetting[]): string[] {
  return states.map((state) =>
    JSON.stringify({
      marker: state.marker,
      label: state.label,
      done: state.done,
      bold: state.bold,
      italic: state.italic,
      underline: state.underline,
      strike: state.strike,
      ...(state.icon !== undefined ? { icon: state.icon } : {}),
      ...(state.color !== undefined ? { color: state.color } : {}),
      ...(state.background !== undefined ? { background: state.background } : {}),
    }),
  );
}

export function problemWith(state: TaskStateSetting, states: readonly TaskStateSetting[]): string | undefined {
  if ([...state.marker].length !== 1) return "The marker must be a single character.";
  if (RESERVED_MARKERS.includes(state.marker)) return `[${state.marker}] is the built-in to do or done marker.`;
  if (states.find((other) => other.marker === state.marker) !== state) return `[${state.marker}] is used twice.`;
  if (state.label.trim() === "") return "The state needs a name.";
  return undefined;
}

export const usableStates = (states: readonly TaskStateSetting[]): readonly TaskStateSetting[] =>
  states.filter((state) => problemWith(state, states) === undefined);

export function textStyleOf(state: TaskStateSetting): CSSProperties | undefined {
  const lines = [state.underline ? "underline" : "", state.strike ? "line-through" : ""].filter(Boolean).join(" ");
  const style: CSSProperties = {
    ...(state.color !== undefined ? { color: state.color } : {}),
    ...(state.background !== undefined
      ? { background: state.background, borderRadius: "var(--ddd-radius, 4px)", padding: "0 0.3em", boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }
      : {}),
    ...(state.bold ? { fontWeight: "bold" } : {}),
    ...(state.italic ? { fontStyle: "italic" } : {}),
    ...(lines !== "" ? { textDecorationLine: lines } : {}),
  };
  return Object.keys(style).length === 0 ? undefined : style;
}
