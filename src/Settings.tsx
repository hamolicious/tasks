import { useEffect, useRef, useState, type CSSProperties, type ReactElement } from "react";

import type { Kernel } from "@kernel";
import type { Icons } from "plugin:icons";

import {
  DEFAULT_STATES,
  glyphFor,
  newState,
  parseStates,
  problemWith,
  serializeStates,
  STATES_KEY,
  TEXT_STYLES,
  textStyleOf,
  type TaskStateSetting,
  type TextStyle,
} from "./states.js";

export interface SettingsProps {
  readonly kernel: Kernel;
  readonly icons: () => Pick<Icons, "Icon" | "Picker"> | undefined;
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

export function StatesSettings({ kernel, icons }: SettingsProps): ReactElement {
  const [states, setStates] = useState(() => parseStates(kernel.settings.get(STATES_KEY)));
  const [picking, setPicking] = useState<number | undefined>(undefined);
  const iconSet = icons();
  const unsaved = useRef<readonly TaskStateSetting[] | undefined>(undefined);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const writing = useRef(0);

  const write = (next: readonly TaskStateSetting[]): void => {
    writing.current += 1;
    kernel.settings
      .set(STATES_KEY, serializeStates(next))
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
      setStates(parseStates(values[STATES_KEY]));
    });
    return () => {
      off();
      flush();
    };
  }, [kernel]);

  const save = (next: readonly TaskStateSetting[]): void => {
    setStates(next);
    unsaved.current = next;
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, 500);
  };
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
      {states.length === 0 && <p style={{ margin: 0 }}>No extra states. Tasks are only to do or done.</p>}
      {states.map((state, index) => {
        const problem = problemWith(state, states);
        return (
          <fieldset
            key={index}
            style={{ margin: 0, padding: "0.75em", border: "1px solid var(--ddd-border)", borderRadius: "var(--ddd-radius, 6px)", display: "flex", flexDirection: "column", gap: "0.5em" }}
          >
            <div style={row}>
              <button
                type="button"
                style={{ ...button, minWidth: "var(--ddd-tap-target)", fontSize: "1.2em", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                aria-label="Icon"
                title={iconSet ? "Choose an icon" : "Install the icons plugin to choose an icon"}
                disabled={!iconSet}
                aria-expanded={picking === index}
                onClick={() => setPicking(picking === index ? undefined : index)}
              >
                {iconSet && state.icon !== undefined ? <iconSet.Icon name={state.icon} /> : glyphFor(state.marker)}
              </button>
              <label style={row}>
                Marker
                <input
                  style={{ ...input, width: "3em", textAlign: "center", fontFamily: "var(--ddd-font-mono, monospace)" }}
                  value={state.marker}
                  maxLength={2}
                  onChange={(event) => change(index, { marker: [...event.target.value].slice(-1).join("") })}
                />
              </label>
              <label style={{ ...row, flex: "1 1 10em" }}>
                Name
                <input style={{ ...input, flex: 1, minWidth: 0 }} value={state.label} onChange={(event) => change(index, { label: event.target.value })} />
              </label>
              <label style={row}>
                <input type="checkbox" checked={state.done} onChange={(event) => change(index, { done: event.target.checked })} />
                Counts as done
              </label>
              <button
                type="button"
                style={{
                  ...button,
                  minWidth: "var(--ddd-tap-target)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.2em",
                  color: "var(--ddd-danger)",
                  borderColor: "var(--ddd-danger)",
                }}
                aria-label={`Delete ${state.label}`}
                title="Delete"
                onClick={() => remove(index)}
              >
                {iconSet ? <iconSet.Icon name="trash" /> : "✕"}
              </button>
            </div>
            <div style={row}>
              <ColorField label="Text colour" value={state.color} fallback="#000000" onChange={(color) => change(index, { color })} />
              <ColorField label="Background" value={state.background} fallback="#ffff00" onChange={(background) => change(index, { background })} />
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
                    onClick={() => change(index, { [name]: !state[name] })}
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
            {picking === index && iconSet && (
              <iconSet.Picker
                {...(state.icon !== undefined ? { value: state.icon } : {})}
                onChange={(icon) => change(index, { icon })}
              />
            )}
          </fieldset>
        );
      })}
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
