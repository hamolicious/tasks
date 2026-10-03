import { describe, expect, it } from "vitest";

import { DEFAULT_STATES, newState, parseStates, serializeStates, textStyleOf, usableStates } from "./states.js";

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
