import { describe, expect, it } from "vitest";

import {
  BUILTIN_STATES,
  builtinOrder,
  DEFAULT_STATES,
  effectiveBuiltins,
  glyphFor,
  newState,
  parseBuiltins,
  parseStates,
  sameState,
  serializeStates,
  type TaskStateSetting,
  textStyleOf,
  usableStates,
} from "./states.js";

const isFlatList = (value: unknown): boolean =>
  Array.isArray(value) && value.every((item) => item === null || ["string", "number", "boolean"].includes(typeof item));

describe("stored task states", () => {
  it("are saved as a flat list, which is all kernel settings accept", () => {
    expect(isFlatList(serializeStates(DEFAULT_STATES))).toBe(true);
  });

  it("read back exactly as they were saved", () => {
    const custom = {
      ...newState("!"),
      label: "Urgent",
      icon: "alert-triangle",
      color: "#ff0000",
      background: "#ffff00",
      bold: true,
      italic: true,
      underline: true,
      strike: true,
    };
    const states = [...DEFAULT_STATES, custom];
    expect(parseStates(serializeStates(states))).toEqual(states);
  });

  it("fall back to the defaults when nothing is saved, and stay empty when all were deleted", () => {
    expect(parseStates(undefined)).toEqual(DEFAULT_STATES);
    expect(parseStates(serializeStates([]))).toEqual([]);
  });

  it("skip entries that cannot be read", () => {
    expect(parseStates(["not json", 3, JSON.stringify({ label: "no marker" })])).toEqual([]);
  });
});

describe("a state's text style", () => {
  it("combines every chosen style and colour", () => {
    expect(
      textStyleOf({ ...newState("!"), color: "#ff0000", bold: true, italic: true, underline: true, strike: true }),
    ).toEqual({
      color: "#ff0000",
      fontWeight: "bold",
      fontStyle: "italic",
      textDecorationLine: "underline line-through",
    });
  });

  it("is absent for a plain state", () => {
    expect(textStyleOf(newState("!"))).toBeUndefined();
  });
});

describe("usable states", () => {
  it("leave out reserved, duplicate and empty markers", () => {
    const states = [newState("x"), newState("!"), newState("!"), newState("")];
    expect(usableStates(states).map((state) => state.marker)).toEqual(["!"]);
  });
});

describe("built-in overrides", () => {
  const stored = (state: Partial<TaskStateSetting>): string => JSON.stringify({ label: "x", done: false, ...state });

  it("keeps only to do and done, with their marker and done flag fixed", () => {
    const overrides = parseBuiltins([
      stored({ marker: "x", label: "Finished", done: false, strike: true }),
      stored({ marker: "/", label: "Not a built-in" }),
      stored({ marker: " ", label: "  " }),
    ]);
    expect(overrides).toHaveLength(1);
    expect(overrides[0]).toMatchObject({ marker: "x", label: "Finished", done: true, strike: true });
    expect(parseBuiltins(undefined)).toEqual([]);
  });

  it("falls back to the built-in look for anything not overridden", () => {
    const effective = effectiveBuiltins(parseBuiltins([stored({ marker: "x", label: "Finished" })]));
    expect(effective.map((state) => [state.marker, state.label])).toEqual([
      [" ", "To do"],
      ["x", "Finished"],
    ]);
  });

  it("registers ahead of markdown's own to do and done", () => {
    expect(builtinOrder(" ")).toBeLessThan(0);
    expect(builtinOrder("x")).toBeLessThan(10);
    expect(glyphFor(" ")).toBe("☐");
    expect(glyphFor("x")).toBe("☑");
  });

  it("treats an unchanged copy of a built-in as no override", () => {
    expect(sameState({ ...BUILTIN_STATES[1]! }, BUILTIN_STATES[1]!)).toBe(true);
    expect(sameState({ ...BUILTIN_STATES[1]!, bold: true }, BUILTIN_STATES[1]!)).toBe(false);
  });
});
