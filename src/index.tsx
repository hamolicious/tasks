import type { Kernel } from "@kernel";
import { addTaskState, type MarkdownTaskState } from "plugin:markdown";

import { StatesSettings } from "./Settings.js";
import { glyphFor, parseStates, STATES_KEY, textStyleOf, usableStates, type TaskStateSetting } from "./states.js";

type IconsModule = typeof import("plugin:icons");
type SettingsModule = typeof import("plugin:settings");

const toTaskStates = (states: readonly TaskStateSetting[], icons: IconsModule | undefined): readonly MarkdownTaskState[] =>
  usableStates(states).map((state, index) => {
    const style = textStyleOf(state);
    return {
      marker: state.marker,
      label: state.label,
      icon: icons && state.icon !== undefined ? <icons.Icon name={state.icon} /> : glyphFor(state.marker),
      order: 15 + index * 5,
      done: state.done,
      ...(style !== undefined ? { style } : {}),
    };
  });

let teardown: (() => void)[] = [];

export default function activate(kernel: Kernel): void {
  let active = true;
  let icons: IconsModule | undefined;
  let removeStates = (): void => {};

  const register = (): void => {
    removeStates();
    removeStates = addTaskState(toTaskStates(parseStates(kernel.settings.get(STATES_KEY)), icons));
  };
  register();

  teardown = [
    () => {
      active = false;
      removeStates();
    },
    kernel.settings.subscribe(register),
  ];

  void kernel.plugins
    .optional<IconsModule>("icons")
    .catch(() => undefined)
    .then((module) => {
      if (!module || !active) return;
      icons = module;
      register();
    });

  void kernel.plugins
    .optional<SettingsModule>("settings")
    .catch(() => undefined)
    .then((settings) => {
      if (!settings || !active) return;
      teardown.push(
        settings.addSection({
          id: "extra-task-states",
          title: "Task states",
          description: "The extra task markers, their names and icons.",
          order: 400,
          component: () => <StatesSettings kernel={kernel} icons={() => icons} />,
        }),
      );
    });
}

export function deactivate(): void {
  for (const off of teardown) off();
  teardown = [];
}
