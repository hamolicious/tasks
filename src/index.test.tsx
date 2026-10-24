import { expect, test, vi } from "vitest";

import manifest from "../manifest.json";
import activate, { deactivate } from "./index.js";

test("manifest targets the kernel with the slots it fills", () => {
  expect(manifest.kernel).toBe("*");
  expect(manifest.uses).toEqual(["markdown.task-state", "kernel.settings.section"]);
});

test("fills markdown.task-state per marker and the settings section, and removes them on settings change", () => {
  const fills: { slot: string; entry: any; off: ReturnType<typeof vi.fn> }[] = [];
  let listener = (): void => {};
  const kernel: any = {
    settings: { get: () => undefined, subscribe: (fn: () => void) => ((listener = fn), () => {}) },
    component: (name: string) => Object.assign(() => null, { displayName: name }),
    fill: (slot: string, entry: unknown) => {
      const off = vi.fn();
      fills.push({ slot, entry, off });
      return off;
    },
  };
  activate(kernel);
  const states = fills.filter((f) => f.slot === "markdown.task-state").map((f) => f.entry);
  expect(states.map((s) => s.marker)).toEqual(["/", "-", "?"]);
  expect(states.map((s) => s.id)).toEqual(["extra-task-states.task:/", "extra-task-states.task:-", "extra-task-states.task:?"]);
  expect(fills.some((f) => f.slot === "kernel.settings.section")).toBe(true);
  listener();
  expect(fills.filter((f) => f.slot === "markdown.task-state").slice(0, 3).every((f) => f.off.mock.calls.length === 1)).toBe(true);
  deactivate();
});

test("a state with an icon shows the Icon component the kernel hands out", () => {
  const fills: { slot: string; entry: any }[] = [];
  const kernel: any = {
    settings: {
      get: (key: string) => (key.includes("builtin") ? undefined : [JSON.stringify({ marker: "!", label: "Hot", icon: "flame", done: false })]),
      subscribe: () => () => {},
    },
    component: (name: string) => Object.assign(() => null, { displayName: name }),
    fill: (slot: string, entry: unknown) => (fills.push({ slot, entry }), () => {}),
  };
  activate(kernel);
  const hot = fills.map((f) => f.entry).find((e) => e.marker === "!");
  expect(hot?.icon.type.displayName).toBe("Icon");
  expect(hot?.icon.props).toEqual({ name: "flame" });
  deactivate();
});
