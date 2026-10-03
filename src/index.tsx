import type { Kernel } from "@kernel";
import { addTaskState, type MarkdownTaskState } from "plugin:markdown";

import { StatesSettings } from "./Settings.js";
import {
  BUILTINS_KEY,
  builtinOrder,
  glyphFor,
  parseBuiltins,
  parseStates,
  STATES_KEY,
  textStyleOf,
  usableStates,
  type TaskStateSetting,
} from "./states.js";

type IconsModule = typeof import("plugin:icons");
type SettingsModule = typeof import("plugin:settings");

const toTaskState = (state: TaskStateSetting, order: number, icons: IconsModule | undefined): MarkdownTaskState => {
  const style = textStyleOf(state);
  return {
    marker: state.marker,
    label: state.label,
    icon: icons && state.icon !== undefined ? <icons.Icon name={state.icon} /> : glyphFor(state.marker),
    order,
    done: state.done,
    ...(style !== undefined ? { style } : {}),
  };
};

const toTaskStates = (
  builtins: readonly TaskStateSetting[],
  states: readonly TaskStateSetting[],
  icons: IconsModule | undefined,
): readonly MarkdownTaskState[] => [
  ...builtins.map((state) => toTaskState(state, builtinOrder(state.marker), icons)),
  ...usableStates(states).map((state, index) => toTaskState(state, 15 + index * 5, icons)),
];

let teardown: (() => void)[] = [];

export default function activate(kernel: Kernel): void {
  let active = true;
  let icons: IconsModule | undefined;
  let removeStates = (): void => {};

  const register = (): void => {
    removeStates();
    removeStates = addTaskState(
      toTaskStates(parseBuiltins(kernel.settings.get(BUILTINS_KEY)), parseStates(kernel.settings.get(STATES_KEY)), icons),
    );
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
          description: "To do, done and extra task markers: their names, icons and text styles.",
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
