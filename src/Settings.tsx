import { useEffect, useRef, useState, type ComponentType, type CSSProperties, type ReactElement } from "react";

import type { SettingsValue } from "@kernel";

import type { Kernel } from "@kernel";

import {
  BUILTIN_STATES,
  BUILTINS_KEY,
  DEFAULT_STATES,
  effectiveBuiltins,
  glyphFor,
  newState,
  parseBuiltins,
  parseStates,
  problemWith,
  sameState,
  serializeStates,
  STATES_KEY,
  TEXT_STYLES,
  textStyleOf,
  type TaskStateSetting,
  type TextStyle,
} from "./states.js";

export interface SettingsProps {
  readonly kernel: Kernel;
}

const button: CSSProperties = {
  minHeight: "var(--ddd-tap-target)",
  padding: "0 0.6em",
  border: "1px solid var(--ddd-border-strong)",
  borderRadius: "var(--ddd-radius, 6px)",
  background: "var(--ddd-bg-raised)",
  color: "var(--ddd-text)",
  font: "inherit",
  cursor: "pointer",
};

const input: CSSProperties = {
  minHeight: "var(--ddd-tap-target)",
  padding: "0 0.5em",
  border: "1px solid var(--ddd-border-strong)",
  borderRadius: "var(--ddd-radius, 6px)",
  background: "var(--ddd-bg)",
  color: "var(--ddd-text)",
  font: "inherit",
};

const row: CSSProperties = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5em" };

const TOGGLES: Readonly<Record<TextStyle, { readonly label: string; readonly glyph: string; readonly style: CSSProperties }>> = {
  bold: { label: "Bold", glyph: "B", style: { fontWeight: "bold" } },
  italic: { label: "Italic", glyph: "I", style: { fontStyle: "italic" } },
  underline: { label: "Underline", glyph: "U", style: { textDecoration: "underline" } },
  strike: { label: "Strikethrough", glyph: "S", style: { textDecoration: "line-through" } },
};

interface ColorFieldProps {
  readonly label: string;
  readonly value: string | undefined;
  readonly fallback: string;
  readonly onChange: (value: string | undefined) => void;
}

function ColorField({ label, value, fallback, onChange }: ColorFieldProps): ReactElement {
  return (
    <span style={row}>
      <label style={row}>
        {label}
        <input
          type="color"
          style={{ ...input, width: "3em", padding: "0.2em", cursor: "pointer", opacity: value === undefined ? 0.5 : 1 }}
          value={value ?? fallback}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
      {value !== undefined && (
        <button type="button" style={button} aria-label={`Clear the ${label.toLowerCase()}`} onClick={() => onChange(undefined)}>
          None
        </button>
      )}
    </span>
  );
}

interface IconProps {
  readonly name: string;
}

interface IconPickerProps {
  readonly value?: string;
  readonly onChange: (name: string | undefined) => void;
}

interface IconSet {
  readonly Icon: ComponentType<IconProps>;
  readonly Picker: ComponentType<IconPickerProps>;
}

function useStoredStates(
  kernel: Kernel,
  key: string,
  parse: (value: SettingsValue | undefined) => readonly TaskStateSetting[],
): readonly [readonly TaskStateSetting[], (next: readonly TaskStateSetting[]) => void] {
  const [states, setStates] = useState(() => parse(kernel.settings.get(key)));
  const unsaved = useRef<readonly TaskStateSetting[] | undefined>(undefined);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const writing = useRef(0);

  const write = (next: readonly TaskStateSetting[]): void => {
    writing.current += 1;
    kernel.settings
      .set(key, serializeStates(next))
      .catch((error: unknown) => {
        kernel.log.error("extra-task-states: saving the states failed", error);
        kernel.ui.notify({
          id: "extra-task-states.save-failed",
          level: "error",
          message: "Task states could not be saved.",
          detail: String(error),
        });
      })
      .finally(() => {
        writing.current -= 1;
      });
  };

  const flush = (): void => {
    clearTimeout(timer.current);
    timer.current = undefined;
    const next = unsaved.current;
    unsaved.current = undefined;
    if (next !== undefined) write(next);
  };

  useEffect(() => {
    const off = kernel.settings.subscribe((values) => {
      if (unsaved.current !== undefined || writing.current > 0) return;
      setStates(parse(values[key]));
    });
    return () => {
      off();
      flush();
    };
  }, [kernel, key]);

  const save = (next: readonly TaskStateSetting[]): void => {
    setStates(next);
    unsaved.current = next;
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, 500);
  };

  return [states, save];
}

interface StateEditorProps {
  readonly state: TaskStateSetting;
  readonly builtin: boolean;
  readonly problem: string | undefined;
  readonly iconSet: IconSet;
  readonly picking: boolean;
  readonly onPick: () => void;
  readonly onChange: (patch: Partial<TaskStateSetting>) => void;
  readonly onRemove?: () => void;
  readonly onReset?: () => void;
}

const iconButton: CSSProperties = {
  ...button,
  minWidth: "var(--ddd-tap-target)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "1.2em",
};

function StateEditor({ state, builtin, problem, iconSet, picking, onPick, onChange, onRemove, onReset }: StateEditorProps): ReactElement {
  return (
    <fieldset
      style={{ margin: 0, padding: "0.75em", border: "1px solid var(--ddd-border)", borderRadius: "var(--ddd-radius, 6px)", display: "flex", flexDirection: "column", gap: "0.5em" }}
    >
      <div style={row}>
        <button
          type="button"
          style={iconButton}
          aria-label={`Icon for ${state.label}`}
          title="Choose an icon"
          aria-expanded={picking}
          onClick={onPick}
        >
          {state.icon !== undefined ? <iconSet.Icon name={state.icon} /> : glyphFor(state.marker)}
        </button>
        {builtin ? (
          <span style={{ ...row, color: "var(--ddd-text-muted)" }} title="The built-in markers cannot change">
            Marker
            <code style={{ ...input, display: "inline-flex", alignItems: "center", width: "3em", justifyContent: "center", background: "var(--ddd-bg-subtle)" }}>
              [{state.marker}]
            </code>
          </span>
        ) : (
          <label style={row}>
            Marker
            <input
              style={{ ...input, width: "3em", textAlign: "center", fontFamily: "var(--ddd-font-mono, monospace)" }}
              value={state.marker}
              maxLength={2}
              onChange={(event) => onChange({ marker: [...event.target.value].slice(-1).join("") })}
            />
          </label>
        )}
        <label style={{ ...row, flex: "1 1 10em" }}>
          Name
          <input style={{ ...input, flex: 1, minWidth: 0 }} value={state.label} onChange={(event) => onChange({ label: event.target.value })} />
        </label>
        {!builtin && (
          <label style={row}>
            <input type="checkbox" checked={state.done} onChange={(event) => onChange({ done: event.target.checked })} />
            Counts as done
          </label>
        )}
        {onReset !== undefined && (
          <button type="button" style={button} aria-label={`Reset ${state.label}`} title="Back to the built-in look" onClick={onReset}>
            Reset
          </button>
        )}
        {onRemove !== undefined && (
          <button
            type="button"
            style={{ ...iconButton, color: "var(--ddd-danger)", borderColor: "var(--ddd-danger)" }}
            aria-label={`Delete ${state.label}`}
            title="Delete"
            onClick={onRemove}
          >
            <iconSet.Icon name="trash" />
          </button>
        )}
      </div>
      <div style={row}>
        <ColorField label="Text colour" value={state.color} fallback="#000000" onChange={(color) => onChange({ color })} />
        <ColorField label="Background" value={state.background} fallback="#ffff00" onChange={(background) => onChange({ background })} />
        <span style={{ ...row, gap: "0.25em" }} role="group" aria-label="Text style">
          {TEXT_STYLES.map((name) => (
            <button
              key={name}
              type="button"
              style={{
                ...button,
                ...TOGGLES[name].style,
                minWidth: "var(--ddd-tap-target)",
                ...(state[name] ? { background: "var(--ddd-accent-subtle)", borderColor: "var(--ddd-accent)" } : {}),
              }}
              aria-label={TOGGLES[name].label}
              title={TOGGLES[name].label}
              aria-pressed={state[name]}
              onClick={() => onChange({ [name]: !state[name] })}
            >
              {TOGGLES[name].glyph}
            </button>
          ))}
        </span>
      </div>
      <p style={{ margin: 0, color: "var(--ddd-text-muted)" }}>
        Preview:{" "}
        <span style={{ color: state.done ? "var(--ddd-text-muted)" : "var(--ddd-text)" }}>
          <span style={textStyleOf(state)}>{state.label.trim() === "" ? "A task" : state.label}</span>
        </span>
      </p>
      {problem !== undefined && <p style={{ margin: 0, color: "var(--ddd-danger)" }}>{problem} This state is not used until it is fixed.</p>}
      {picking && (
        <iconSet.Picker {...(state.icon !== undefined ? { value: state.icon } : {})} onChange={(icon) => onChange({ icon })} />
      )}
    </fieldset>
  );
}

export function StatesSettings({ kernel }: SettingsProps): ReactElement {
  const [overrides, saveOverrides] = useStoredStates(kernel, BUILTINS_KEY, parseBuiltins);
  const [states, save] = useStoredStates(kernel, STATES_KEY, parseStates);
  const [picking, setPicking] = useState<string | undefined>(undefined);
  const iconSet: IconSet = { Icon: kernel.component<IconProps>("Icon"), Picker: kernel.component<IconPickerProps>("IconPicker") };
  const pick = (id: string): void => setPicking(picking === id ? undefined : id);

  const changeBuiltin = (marker: string, patch: Partial<TaskStateSetting>): void => {
    const builtin = BUILTIN_STATES.find((candidate) => candidate.marker === marker);
    if (!builtin) return;
    const current = overrides.find((override) => override.marker === marker) ?? builtin;
    const next = { ...current, ...patch, marker: builtin.marker, done: builtin.done };
    const others = overrides.filter((override) => override.marker !== marker);
    saveOverrides(sameState(next, builtin) ? others : [...others, next]);
  };
  const resetBuiltin = (marker: string): void => saveOverrides(overrides.filter((override) => override.marker !== marker));

  const change = (index: number, patch: Partial<TaskStateSetting>): void =>
    save(states.map((state, at) => (at === index ? { ...state, ...patch } : state)));
  const remove = (index: number): void => {
    setPicking(undefined);
    save(states.filter((_, at) => at !== index));
  };
  const add = (): void => {
    const marker = [..."!*>~<+=@#"].find((candidate) => !states.some((state) => state.marker === candidate)) ?? "";
    save([...states, newState(marker)]);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1em" }}>
      <p style={{ margin: 0, color: "var(--ddd-text-muted)" }}>
        Write a state in a note as <code>- [marker] task</code>. A task marked done is ticked and greyed out.
      </p>
      <h3 style={{ margin: 0, fontSize: "1em" }}>To do and done</h3>
      {effectiveBuiltins(overrides).map((state) => {
        const overridden = overrides.some((override) => override.marker === state.marker);
        return (
          <StateEditor
            key={`builtin:${state.marker}`}
            state={state}
            builtin
            problem={state.label.trim() === "" ? "The state needs a name." : undefined}
            iconSet={iconSet}
            picking={picking === `builtin:${state.marker}`}
            onPick={() => pick(`builtin:${state.marker}`)}
            onChange={(patch) => changeBuiltin(state.marker, patch)}
            {...(overridden ? { onReset: () => resetBuiltin(state.marker) } : {})}
          />
        );
      })}
      <h3 style={{ margin: 0, fontSize: "1em" }}>Extra states</h3>
      {states.length === 0 && <p style={{ margin: 0 }}>No extra states. Tasks are only to do or done.</p>}
      {states.map((state, index) => (
        <StateEditor
          key={index}
          state={state}
          builtin={false}
          problem={problemWith(state, states)}
          iconSet={iconSet}
          picking={picking === `extra:${index}`}
          onPick={() => pick(`extra:${index}`)}
          onChange={(patch) => change(index, patch)}
          onRemove={() => remove(index)}
        />
      ))}
      <div style={row}>
        <button type="button" style={button} onClick={add}>
          Add a state
        </button>
        <button type="button" style={button} onClick={() => save(DEFAULT_STATES)}>
          Restore the defaults
        </button>
      </div>
    </div>
  );
}
