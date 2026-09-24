/**
 * `@kernel` — the Life Manager plugin contract.
 *
 * Generated from web/kernel-api/src by web/scripts/build-kernel-dts.mjs.
 * Do not edit: edit the source and re-run `npm run kernel:dts`.
 *
 * Contract version: 1.1.0
 * Served by the server at /kernel.d.ts (SPEC §6.4).
 */

declare module "@kernel" {
  import type * as Y from "yjs";
  import type { ComponentType, ReactNode } from "react";

  // ---- index.ts ------------------------------------------------
  /**
   * `@kernel` — the entire public contract between the kernel and a plugin
   * (SPEC §6.4: "Types are the contract").
   *
   * This barrel is what the import map resolves `@kernel` to at runtime, what
   * `/kernel.d.ts` is generated from, and the only thing a plugin may import from
   * the host. A plugin that reaches into `@kernel/…` internals is depending on an
   * implementation that is free to change inside one kernel version.
   *
   * ```ts
   * import type { Kernel } from "@kernel";
   *
   * export default function activate(kernel: Kernel) {
   *   kernel.extensions.contribute("navbar.item", { id: "hello", label: "Hello" });
   *   return { greet: () => "hi" };            // this plugin's API, for dependents
   * }
   * ```
   *
   * **FROZEN.** One `kernel` semver covers this surface and the Wasm host ABI;
   * removals and signature changes are a major (SPEC §6.4). `docs/KERNEL-API.md` is
   * the changelog.
   */
  export const KERNEL_API_VERSION = "1.1.0";
  /** Major of {@link KERNEL_API_VERSION} — what a manifest's `kernel` range is checked against. */
  export const KERNEL_API_MAJOR = 1;

  // ---- capabilities.ts -----------------------------------------
  /**
   * `kernel.capabilities` — feature detection plus the native bridge (SPEC §6.4, §7).
   *
   * Every capability has a **browser fallback and is mandatory to degrade** (SPEC
   * §7): a plugin written against this surface works in a plain browser tab and
   * gains fidelity inside the Flutter shell, and never has to ask which one it is
   * in. `has()` is there for the one legitimate case — not offering a UI affordance
   * that cannot work at all (scheduled reminders in a browser tab).
   *
   * Scope, stated exactly as SPEC §7 does: v1 reminders are **foreground (browser)**
   * and **scheduled local (shell)**. Server push, device registration and Web Push
   * are v2 — a plugin author should not plan around them.
   *
   * On the web the bridge is absent and `bridgeVersion` is `undefined`. In the shell
   * it is `window.shell`'s version; a **major** mismatch against
   * {@link SUPPORTED_BRIDGE_VERSION} means the shell is too old — capabilities fall
   * back rather than calling an ABI they do not understand.
   *
   * **FROZEN.**
   */
  /** The bridge major version this kernel speaks (SPEC §7: versioned `window.shell`). */
  export const SUPPORTED_BRIDGE_VERSION = 1;
  export type CapabilityName = "filesystem" | "notifications";
  /** How a capability is being served right now — the honest answer for a UI. */
  export type CapabilitySupport = "native" | "fallback" | "unavailable";
  export interface FileExport {
      readonly name: string;
      readonly mime: string;
      /** Exactly one of the two. */
      readonly text?: string;
      readonly bytes?: Uint8Array;
  }
  export interface PickedFile {
      readonly name: string;
      readonly mime: string;
      readonly size: number;
      bytes(): Promise<Uint8Array>;
      text(): Promise<string>;
  }
  export interface PickOptions {
      /** MIME types or extensions, e.g. `["text/markdown", ".md"]`. */
      readonly accept?: readonly string[];
      readonly multiple?: boolean;
  }
  export interface FilesystemCapability {
      readonly support: CapabilitySupport;
      /**
       * Hand a file to the user. Native: the platform save dialog. Fallback: a
       * `blob:` download. Rejects with `CapabilityUnavailableError` only when
       * both are impossible.
       */
      export(file: FileExport): Promise<void>;
      /** Ask the user for files. Fallback: a hidden `<input type="file">`. */
      pick(options?: PickOptions): Promise<readonly PickedFile[]>;
      /**
       * The whole workspace as a zip — `GET /api/admin/export`, the no-Mongo recovery
       * path of SPEC §5.1. **Admin-only server-side**, so gate the affordance on
       * `session.isAdmin()` however the UI is drawn: a non-admin gets a 403.
       *
       * **Optional on purpose, and the reason is the M5 rule "an absent capability is
       * reported absent"** (`app/BRIDGE.md` §3): it exists only where it can actually
       * work — the shell's native streamed download, or a cookie session that can
       * authenticate a plain download link. A bearer session with no native handler
       * leaves it `undefined` rather than offering a button that 401s, because the
       * token lives in the shell's keystore and no navigation can carry it.
       *
       * It is not `export(bytes)`: the archive is the whole workspace and must never
       * be held in the webview's heap (`app/BRIDGE.md` §4.2).
       *
       * Added in M5 as an **optional** member of this otherwise frozen interface
       * (`app/CONTRACTS.md`, area web-shim).
       */
      exportWorkspace?(): Promise<void>;
  }
  export type NotificationPermissionState = "granted" | "denied" | "default";
  export interface NotificationRequest {
      readonly title: string;
      readonly body?: string;
      /** Stable id, so a re-issued reminder replaces rather than stacks. */
      readonly tag?: string;
      /** Opened when the notification is tapped — an in-app route, not a URL. */
      readonly route?: string;
  }
  export interface NotificationsCapability {
      readonly support: CapabilitySupport;
      permission(): NotificationPermissionState;
      request(): Promise<NotificationPermissionState>;
      /** Fire now. Browser: only while a tab is open (SPEC §7). */
      notify(notification: NotificationRequest): Promise<void>;
      /**
       * `true` only in a shell that can schedule local notifications — i.e. ones that
       * fire with the app closed. Check it before offering reminders.
       */
      readonly supportsScheduled: boolean;
      /** Schedule for `at` (epoch ms). Returns a cancellation id. Shell only. */
      schedule(notification: NotificationRequest, at: number): Promise<string>;
      cancel(id: string): Promise<void>;
      /** Everything this client has scheduled and not yet fired. */
      scheduled(): Promise<readonly {
          readonly id: string;
          readonly at: number;
      }[]>;
  }
  export interface CapabilitiesApi {
      /** `true` when the capability can do something real — native *or* fallback. */
      has(name: CapabilityName): boolean;
      support(name: CapabilityName): CapabilitySupport;
      /** The shell bridge version, or `undefined` in a browser. */
      readonly bridgeVersion: number | undefined;
      readonly filesystem: FilesystemCapability;
      readonly notifications: NotificationsCapability;
      /**
       * Persistent storage (SPEC §6.4): the kernel requests it at first login and
       * warns when it is denied or quota nears. Exposed read-only so a plugin about to
       * write a lot can check first.
       */
      storage(): Promise<StorageReport>;
  }
  export interface StorageReport {
      readonly persisted: boolean;
      readonly usageBytes?: number;
      readonly quotaBytes?: number;
  }

  // ---- documents.ts --------------------------------------------
  /**
   * `kernel.documents` — the only domain model the kernel knows: **a document is
   * text** (body + frontmatter + `%%%` machine sections, SPEC §2).
   *
   * Three things live here and nothing else does:
   *
   * 1. **Reads are local.** `query`/`subscribe`/`search` run against the replicated
   *    projection in IndexedDB through the shared Wasm evaluator — online or offline,
   *    live-updating (SPEC §4.1, §4.2). No plugin reaches for `/api/documents` to
   *    browse; the REST endpoints exist for scripts and backend plugins.
   * 2. **Writes to an open document are CRDT text edits.** `open()` hydrates the
   *    `Y.Doc` lazily and hands over the one root `Y.Text`.
   * 3. **Metadata writes are splices, never round-trips** (SPEC §3.3). `splice` is
   *    the *mandatory* path for `fm` values and for a plugin's own `%%%` section:
   *    parse→re-serialize→replace destroys comments and corrupts under concurrent
   *    edits, and whole-section rewrites throw away the per-key LWW that line
   *    splices reconstruct (SPEC §11.2).
   *
   * **FROZEN.**
   */
  export type DocumentId = string;
  /** The filter DSL wire form (SPEC §4.2) — ours, not Mongo's. */
  export type FilterJson = {
      readonly [key: string]: unknown;
  };
  export type SortDirection = "asc" | "desc";
  /** One sort key: a dotted projection path (`title`, `fm.path`, `updated_at`). */
  export interface SortKey {
      readonly field: string;
      readonly direction: SortDirection;
  }
  /**
   * One replicated document row (SPEC §4.1). `content` is the whole materialized
   * text including frontmatter and `%%%` sections — a viewer hides those, it does
   * not get a pre-stripped body.
   */
  export interface DocumentRow {
      readonly id: DocumentId;
      readonly title: string;
      readonly content?: string;
      readonly fm: CoreMap;
      readonly plugins: CoreMap;
      readonly fm_parse_error: boolean;
      readonly materialized_version: string;
      readonly created_at: Iso8601;
      readonly created_by: string | null;
      readonly updated_at: Iso8601;
      readonly updated_by: string | null;
      readonly deleted: boolean;
      readonly deleted_at: Iso8601 | null;
      readonly deleted_by: string | null;
      /** `true` ⇒ permanently purged; the row and any local replica are gone. */
      readonly purged: boolean;
  }
  export interface DocumentQuery {
      readonly filter?: FilterJson;
      readonly sort?: readonly SortKey[];
      readonly search?: string;
      readonly limit?: number;
      readonly offset?: number;
      /** Default `false`: tombstoned rows are the Trash view's business. */
      readonly includeDeleted?: boolean;
  }
  export interface DocumentQueryResult {
      readonly rows: readonly DocumentRow[];
      /** Matches before `limit`/`offset` — the count a UI shows. */
      readonly total: number;
  }
  /** A live query. `result` is always current; `onChange` fires after every change that alters it. */
  export interface QuerySubscription {
      readonly result: DocumentQueryResult;
      onChange(listener: (result: DocumentQueryResult) => void): Unsubscribe;
      close(): void;
  }
  export interface SearchOptions {
      readonly limit?: number;
      readonly prefix?: boolean;
      readonly fuzzy?: number | boolean;
      readonly fields?: readonly ("title" | "content" | "fm")[];
      readonly includeDeleted?: boolean;
      /** Intersect the ranked hits with a filter. */
      readonly filter?: FilterJson;
  }
  export interface SearchHit {
      readonly id: DocumentId;
      readonly score: number;
      /** Terms that matched, for highlighting. */
      readonly terms: readonly string[];
  }
  export type DocumentPhase = "hydrating" | "live" | "error" | "released";
  /**
   * A hydrated document. The `Y.Text` is the single source of truth for the whole
   * text; `doc` is there for `y-codemirror.next` and `Y.UndoManager`.
   *
   * `release()` when you are done — the last release unsubscribes from the server
   * and lets the LRU evict the replica (SPEC §4.1).
   */
  export interface OpenDocument {
      readonly id: DocumentId;
      readonly doc: Y.Doc;
      readonly text: Y.Text;
      readonly phase: DocumentPhase;
      /** Awareness payloads, relayed opaquely in both directions (SPEC §3.2). */
      onAwareness(listener: (payload: Uint8Array) => void): Unsubscribe;
      sendAwareness(payload: Uint8Array): void;
      release(): void;
  }
  /** A half-open range in **UTF-16 code units** — `Y.Text` indices, not byte offsets. */
  export interface TextRange {
      readonly start: number;
      readonly end: number;
  }
  /** Replace `range` with `text`. The one write primitive underneath every splice. */
  export interface TextEdit {
      readonly range: TextRange;
      readonly text: string;
  }
  /**
   * One line of a `%%%` section.
   *
   * `value` is written literally — **`null` writes the YAML `null`**, which the strict
   * subset of SPEC §3.4 has and this shape previously had no way to spell. To delete a
   * key's line instead, set {@link SectionLineEdit.remove}; `value` is then ignored and
   * may be anything.
   *
   * `remove` is an additive optional field (`web/CONTRACTS.md`: the one exception to the
   * frozen surface). It exists because a single `value` field cannot mean both "write
   * this" and "write nothing": `FmValue` already contains `null`, so the older reading —
   * `value: null` deletes — spent the only spelling JSON has for an explicit null on
   * deletion, and the algorithm underneath (`core::splice::SectionLineEdit`, an
   * `Option<Value>`) could express a distinction the contract could not.
   */
  export interface SectionLineEdit {
      readonly key: string;
      readonly value: FmValue | null;
      /** Delete the key's line. A key that is not there is not an error. */
      readonly remove?: boolean;
  }
  /** Anything a splice can be aimed at: an id, or an already-open document. */
  export type SpliceTarget = DocumentId | OpenDocument;
  /**
   * The splice helpers (SPEC §3.3, §6.4). Every method computes its edits with the
   * **shared Rust core** — the same code the server's `splice_section` host function
   * runs — and applies them in one `Y.Doc` transaction.
   *
   * Two rules a caller cannot opt out of:
   *
   * - A plugin may splice **only its own** `%%%` section. `spliceSection` takes no
   *   plugin id: it is the calling plugin's, always. Writing another plugin's
   *   section is how per-key LWW stops working.
   * - Frontmatter is human-owned (SPEC §3.3). `setFrontmatterValue` replaces one
   *   key's value span; it never reformats, reorders or re-serializes the block, and
   *   it is the only sanctioned way for a UI (properties panel, folder drag) to
   *   write `fm`.
   */
  export interface DocumentSpliceApi {
      /** Set or insert one frontmatter key's value. Creates the block if absent. */
      setFrontmatterValue(target: SpliceTarget, key: string, value: FmValue): Promise<void>;
      /** Remove one frontmatter key's line. A missing key is not an error. */
      removeFrontmatterKey(target: SpliceTarget, key: string): Promise<void>;
      /** Line-splice the calling plugin's own `%%%` section. Creates it if absent. */
      spliceSection(target: SpliceTarget, edits: readonly SectionLineEdit[]): Promise<void>;
      /** Remove the calling plugin's whole `%%%` section (uninstall/cleanup). */
      removeSection(target: SpliceTarget): Promise<void>;
      /**
       * The edits that `setFrontmatterValue` would apply, against a text you already
       * hold. Pure; for previews, tests, and callers batching several writes into one
       * transaction with {@link apply}.
       */
      planFrontmatterValue(text: string, key: string, value: FmValue | null): readonly TextEdit[];
      /** The edits `spliceSection` would apply. Pure. */
      planSection(text: string, edits: readonly SectionLineEdit[]): readonly TextEdit[];
      /**
       * Apply edits to an open document in one transaction, highest offset first.
       * `origin` is passed to the `Y.Doc` transaction so an editor can recognise its
       * own writes (`y-codemirror.next` needs this to avoid echoing them back).
       */
      apply(target: OpenDocument, edits: readonly TextEdit[], origin?: unknown): void;
  }
  export interface CreateDocumentInput {
      /** Client-mintable ULID (SPEC §3.5). Omit and the kernel mints one. */
      readonly id?: DocumentId;
      /** The full text, frontmatter and sections included. */
      readonly text: string;
  }
  export interface DocumentsApi {
      /** One projection row from the local store. */
      get(id: DocumentId): Promise<DocumentRow | undefined>;
      /** The materialized text from the local store (`undefined` if unknown offline). */
      text(id: DocumentId): Promise<string | undefined>;
      /** One-shot local query. */
      query(query: DocumentQuery): Promise<DocumentQueryResult>;
      /** Live local query; re-runs only when a change can alter the result. */
      subscribe(query: DocumentQuery): Promise<QuerySubscription>;
      /** Ranked full-text search over the local index (SPEC §4.2). */
      search(text: string, options?: SearchOptions): Promise<readonly SearchHit[]>;
      /** Hydrate for editing. Reference-counted: every `open` needs a `release`. */
      open(id: DocumentId): Promise<OpenDocument>;
      /** Create from full text. Resolves once the server has accepted the id. */
      create(input: CreateDocumentInput): Promise<DocumentId>;
      /** Tombstone → Trash for 30 days (SPEC §3.5). Not a purge. */
      delete(id: DocumentId): Promise<void>;
      /** Restore a tombstoned document. */
      restore(id: DocumentId): Promise<void>;
      readonly splice: DocumentSpliceApi;
  }

  // ---- errors.ts -----------------------------------------------
  /**
   * The error types the kernel throws at plugins, and the one helper every stub in
   * this repository uses.
   *
   * Errors are typed because the loader has to make decisions from them: an
   * `activate()` that throws marks the plugin failed and skips its transitive
   * dependents (SPEC §6.4), and a `ContractViolationError` is the kernel saying
   * "your contribution is malformed" rather than "something went wrong".
   *
   * **FROZEN.**
   */
  /** Base class, so `catch (e) { if (e instanceof KernelError) … }` works. */
  export class KernelError extends Error {
      readonly detail?: Readonly<Record<string, unknown>> | undefined;
      constructor(message: string, detail?: Readonly<Record<string, unknown>> | undefined);
  }
  /**
   * A plugin's contribution or call violated the contract: an unknown extension
   * point shape, a duplicate `definePoint`, a `require()` of an undeclared
   * dependency. Thrown loudly and never swallowed (SPEC §6.4: "rejects loudly").
   */
  export class ContractViolationError extends KernelError {
  }
  /** A plugin failed to activate, or a contributed component threw while rendering. */
  export class PluginError extends KernelError {
      readonly pluginId: string;
      readonly cause?: unknown | undefined;
      constructor(pluginId: string, message: string, cause?: unknown | undefined);
  }
  /**
   * A capability is not available here (no shell bridge, no browser fallback, or
   * permission denied). Carries the capability name so a UI can say which one and
   * what the fallback was (SPEC §7: "Browser fallback/degradation mandatory").
   */
  export class CapabilityUnavailableError extends KernelError {
      readonly capability: string;
      constructor(capability: string, reason: string);
  }
  /** The shared Wasm core is missing or disagrees with the server's semantics version. */
  export class CoreUnavailableError extends KernelError {
  }
  /**
   * A scaffold stub. Every unimplemented body in this tree throws this, so a
   * half-built app reports *what* is missing instead of rendering blank.
   */
  export class NotImplementedError extends KernelError {
  }
  export function notImplemented(what: string): never;

  // ---- events.ts -----------------------------------------------
  /**
   * `kernel.events` — the in-page bus, plus the delivery point for server-pushed
   * plugin events.
   *
   * **Documents first.** SPEC §1 is explicit: when two halves of a plugin need to
   * share state, the backend writes *documents* and sync carries them everywhere,
   * offline included. Events are for what genuinely cannot be a document —
   * "the palette opened", "re-render now", a backend `emit_client` ping.
   *
   * Consequences, stated so nobody designs around the wrong one:
   *
   * - Events are **ephemeral and fire-and-forget**. No replay, no offline queue, no
   *   delivery guarantee. A client that was closed missed it (SPEC §6.3).
   * - `type` is a free string; the convention is `"<plugin-id>:<event>"`. The kernel
   *   reserves the `kernel:` prefix and rejects an `emit` using it.
   *
   * **FROZEN.**
   */
  /** Reserved prefix: only the kernel emits these. */
  export const KERNEL_EVENT_PREFIX = "kernel:";
  /** Events the kernel itself emits. Names are frozen; the payloads are below. */
  export const KernelEvents: {
      /** A plugin failed to activate, or its contribution threw while rendering. */
      readonly pluginFailed: "kernel:plugin-failed";
      /** A new app bundle or plugin version is available (one reload covers both). */
      readonly updateAvailable: "kernel:update-available";
      /** Sync status changed — the same state `kernel.sync.subscribe` reports. */
      readonly syncChanged: "kernel:sync-changed";
      /** The session needs re-authentication (close code 4401). Local data is intact. */
      readonly authRequired: "kernel:auth-required";
      /** Storage is under pressure or persistence was denied (SPEC §6.4). */
      readonly storageWarning: "kernel:storage-warning";
  };
  export type KernelEventName = (typeof KernelEvents)[keyof typeof KernelEvents];
  export type EventOrigin = {
      readonly kind: "kernel";
  } | {
      readonly kind: "plugin";
      readonly id: string;
  }
  /** Relayed from a backend plugin half over the socket (M4 `emit_client`). */
   | {
      readonly kind: "server";
      readonly plugin: string;
  };
  export interface KernelEvent<P = unknown> {
      readonly type: string;
      readonly payload: P;
      readonly origin: EventOrigin;
      /** `Date.now()` at emit. Never used for ordering (SPEC: order is `seq`). */
      readonly at: number;
  }
  export interface EventsApi {
      /** Emit locally. Throws on the reserved `kernel:` prefix. */
      emit<P>(type: string, payload?: P): void;
      on<P>(type: string, listener: (event: KernelEvent<P>) => void): Unsubscribe;
      once<P>(type: string, listener: (event: KernelEvent<P>) => void): Unsubscribe;
      /** Every event, for debug panels. Do not build features on it. */
      onAny(listener: (event: KernelEvent) => void): Unsubscribe;
  }

  // ---- extensions.ts -------------------------------------------
  /**
   * `kernel.extensions` — the registry the whole microkernel turns on (SPEC §6.4).
   *
   * The kernel knows point *names* only as opaque strings: `navbar.item` means
   * nothing to it, and everything to `shell-ui`. A plugin **defines** the points it
   * owns and **contributes** to anyone's.
   *
   * The four behaviours the contract pins, because the plugin graph depends on them:
   *
   * - **Contributions to an undefined point buffer** and are delivered when (if) the
   *   point is defined. Load order is a topological order over *declared
   *   dependencies*, so a contributor may legitimately run before the owner of a
   *   point it does not depend on.
   * - **A duplicate `definePoint` throws.** Two owners of one name is an
   *   unresolvable conflict, not a merge.
   * - **`get`/`subscribe` are live.** `subscribe` fires immediately with the current
   *   values and again after every change; a panel that renders `get()` once at
   *   activation is a bug waiting for the next contributor.
   * - **Shape validation rejects loudly.** A malformed contribution throws at
   *   `contribute()` — the calling plugin's fault, reported against the calling
   *   plugin, not a silently missing menu entry three screens later.
   *
   * **FROZEN.**
   */
  /** Default `order` for a contribution that does not ask for one. */
  export const DEFAULT_CONTRIBUTION_ORDER = 100;
  export interface ExtensionPointDefinition<T> {
      /** Dotted, lowercase, owner-prefixed: `navbar.item`, `markdown.directive`. */
      readonly name: string;
      /** Minimal runtime shape validation. Omit only for a point taking any value. */
      readonly shape?: Shape<T>;
      /** One line, shown in the admin/extension inspector. */
      readonly description?: string;
      /**
       * Identity within the point, for de-duplication and stable React keys. Two
       * contributions with the same key: **first one wins**, the second is reported
       * and dropped (the conflict rule `commands` already applies to keybindings).
       */
      readonly key?: (value: T) => string;
  }
  export interface Contribution<T> {
      readonly point: string;
      /** Which plugin contributed it. Always the caller — never caller-supplied. */
      readonly pluginId: string;
      readonly value: T;
      /** Ascending; ties broken by activation order. */
      readonly order: number;
  }
  /** The handle `definePoint` returns to the point's owner. */
  export interface ExtensionPoint<T> {
      readonly name: string;
      /** Current values, ordered. */
      get(): readonly T[];
      /** Current contributions with their attribution — for error messages and admin. */
      entries(): readonly Contribution<T>[];
      /** Fires immediately, then after every change. */
      subscribe(listener: (values: readonly T[]) => void): Unsubscribe;
  }
  export interface ContributeOptions {
      /** Ascending sort position within the point; default {@link DEFAULT_CONTRIBUTION_ORDER}. */
      readonly order?: number;
  }
  export interface ExtensionsApi {
      /**
       * Claim a point. Throws `ContractViolationError` if the name is already
       * defined. The returned handle is the owner's read side; contributions that
       * arrived before this call are already in it.
       */
      definePoint<T>(definition: ExtensionPointDefinition<T>): ExtensionPoint<T>;
      /**
       * Contribute a value. Validated against the point's shape when the point is
       * defined, and at definition time when it is not (buffered contributions are
       * re-validated then, and a bad one is dropped with a reported error).
       */
      contribute<T>(point: string, value: T, options?: ContributeOptions): Disposable;
      /** Current values of a point; `[]` for an undefined one. */
      get<T>(point: string): readonly T[];
      /** Current contributions with attribution. */
      entries<T>(point: string): readonly Contribution<T>[];
      /** Live read: fires immediately, then after every change. Works on undefined points. */
      subscribe<T>(point: string, listener: (values: readonly T[]) => void): Unsubscribe;
      isDefined(point: string): boolean;
      /** Every defined point name, sorted — the extension inspector's data. */
      points(): readonly string[];
      /** Contributions still waiting for their point to be defined. */
      pending(): readonly Contribution<unknown>[];
  }

  // ---- kernel.ts -----------------------------------------------
  /**
   * The `@kernel` module itself: what a plugin's `activate()` receives.
   *
   * **The object is per-plugin.** Every call is attributed to the plugin that made
   * it — contributions carry its id, `settings` reads its namespace, `splice` writes
   * its `%%%` section, `services.require` is checked against its declared
   * dependencies, and `log` is prefixed with its id. A plugin cannot spoof another
   * by passing an id, because it never passes one.
   *
   * **Activation is reload-only** (SPEC §6.4). Plugins load once at boot in
   * topological order; `deactivate` exists for symmetry and for the `?safe=bare`
   * teardown, and installing or enabling a plugin prompts "reload to activate".
   * Backend halves still hot-load (M4) — that asymmetry is deliberate.
   *
   * **FROZEN.**
   */
  /**
   * The shared Rust core, in the client (SPEC §2: parity by construction).
   *
   * Exposed because plugins legitimately need to read a document's metadata out of
   * text they hold — a preview, a paste, an unsaved buffer — and a TypeScript
   * re-implementation of the frontmatter or `%%%` parser is the single most
   * effective way to make client and server disagree.
   */
  export interface CoreApi {
      /** Frontmatter, `%%%` sections, and the resolved title of a text. */
      parseDocument(text: string): ParsedText;
      /** Title resolution alone: `fm.title` → first ATX heading → first line → "Untitled". */
      resolveTitle(text: string): string;
      /** Canonical ISO-8601 form, so lexicographic sort is correct (SPEC §3.4). */
      normalizeDate(input: string): string;
      /** The core's semantics version, compared against the server's at connect. */
      semanticsVersion(): number;
  }
  export interface ParsedText {
      readonly title: string;
      readonly fm: CoreMap;
      readonly plugins: CoreMap;
      readonly fm_parse_error: boolean;
  }
  /** How this client was booted — `safe-*` modes skip or replace the plugin set. */
  export type BootMode = "normal" | "safe" | "bare";
  export interface KernelInfo {
      /** The `@kernel` contract version this build implements (semver). */
      readonly apiVersion: string;
      /** The web bundle's own version, for support questions. */
      readonly bundleVersion: string;
      readonly bootMode: BootMode;
      /** `true` in a Flutter shell webview. */
      readonly shell: boolean;
  }
  export interface Kernel {
      readonly info: KernelInfo;
      /** The calling plugin's id. Attribution is the kernel's, not the caller's. */
      readonly pluginId: string;
      /** The calling plugin's own manifest, as the server served it. */
      readonly manifest: PluginManifest;
      readonly documents: DocumentsApi;
      readonly extensions: ExtensionsApi;
      readonly services: ServicesApi;
      readonly events: EventsApi;
      readonly settings: SettingsApi;
      readonly session: SessionApi;
      readonly sync: SyncApi;
      readonly ui: UiApi;
      readonly capabilities: CapabilitiesApi;
      readonly core: CoreApi;
      readonly log: KernelLogger;
  }
  /**
   * A frontend plugin module. `activate`'s return value becomes the plugin's API for
   * its dependents (`kernel.services.require`); returning nothing is fine for a
   * plugin nobody depends on.
   *
   * Throwing from `activate` marks the plugin failed and **skips every transitive
   * dependent**, with one aggregated notice linking to admin (SPEC §6.4).
   */
  export type ActivateFn = (kernel: Kernel) => unknown | Promise<unknown>;
  /** Defined for symmetry; activation is reload-only, so it runs only on teardown. */
  export type DeactivateFn = () => void | Promise<void>;
  export interface PluginModule {
      readonly default: ActivateFn;
      readonly deactivate?: DeactivateFn;
  }

  // ---- manifest.ts ---------------------------------------------
  /**
   * The plugin manifest (SPEC §6.2) and the loader's view of an installed plugin.
   *
   * The **server** is the authority: it validates manifests at install, resolves the
   * dependency graph and the `peerLibraries` ranges, and serves the result. The
   * loader re-validates independently anyway, for one reason given in SPEC §6.4: a
   * stale offline client must hard-skip a plugin built for a kernel it does not
   * implement, rather than activate it and fail in pieces.
   *
   * M3 uses the frontend half only. `backend`, `config` and most `capabilities`
   * entries are declared here because the shape is frozen now and enforced in M4.
   *
   * **FROZEN.**
   */
  /** `^[a-z0-9][a-z0-9-]{0,63}$` — also the URL segment under `/plugins/`. */
  export const PLUGIN_ID_PATTERN: RegExp;
  /** `1.2.3` with an optional prerelease/build tail. */
  export const PLUGIN_VERSION_PATTERN: RegExp;
  export interface PluginCapabilities {
      /** Gates the server-side document host functions (SPEC §6.2). */
      readonly documents?: readonly ("read" | "write")[];
      /** Outbound HTTP, per declared hosts. No wildcards. */
      readonly http?: {
          readonly hosts: readonly string[];
      };
      readonly notifications?: boolean;
      /** Unauthenticated routes under `/api/plugins/<id>` — shown at install. */
      readonly "public-routes"?: readonly string[];
  }
  export interface PluginConfigField {
      readonly type: "string" | "number" | "boolean";
      /** Write-only in the admin UI, encrypted at rest (SPEC §6.2). */
      readonly secret?: boolean;
      readonly label?: string;
      readonly description?: string;
      readonly required?: boolean;
  }
  export interface PluginBackend {
      /** Path inside the package, e.g. `backend.wasm`. */
      readonly module: string;
      readonly hooks?: readonly ("document.created" | "document.changed" | "document.deleted")[];
      /** UTC cron expressions. */
      readonly cron?: readonly string[];
  }
  export interface PluginFrontend {
      /** Path inside the package, e.g. `frontend/index.mjs`. */
      readonly module: string;
      /** Linked on activation (SPEC §6.4). */
      readonly style?: string;
  }
  export interface PluginManifest {
      readonly id: string;
      readonly version: string;
      /** Semver range against the `@kernel` contract version. */
      readonly kernel: string;
      /** Plugin id → semver range. Resolved server-side at install. */
      readonly dependencies?: Readonly<Record<string, string>>;
      /** Blessed runtime-layer libraries and their ranges (SPEC §6.4). */
      readonly peerLibraries?: Readonly<Record<string, string>>;
      readonly capabilities?: PluginCapabilities;
      readonly config?: Readonly<Record<string, PluginConfigField>>;
      readonly backend?: PluginBackend;
      readonly frontend?: PluginFrontend;
      /** Human metadata; never load-bearing. */
      readonly name?: string;
      readonly description?: string;
      readonly author?: string;
      readonly license?: string;
  }
  export type PluginState = "enabled" | "disabled" | "pending" | "failed";
  /**
   * One entry of what the server tells the loader (`GET /api/plugins`).
   *
   * `baseUrl` is version-scoped — `/plugins/<id>/<version>/` — so every asset is
   * immutable and cacheable forever (SPEC §8), and a plugin upgrade is a new URL
   * rather than a cache invalidation.
   */
  export interface InstalledPlugin {
      readonly manifest: PluginManifest;
      readonly baseUrl: string;
      readonly state: PluginState;
      /** `true` for the base distribution — what `?safe=1` boots (SPEC §6.1). */
      readonly base: boolean;
  }
  export interface ManifestProblem {
      readonly field: string;
      readonly message: string;
  }
  /**
   * Structural validation of a manifest. Independent of the server's, deliberately:
   * this is the client's own floor, not a duplicate of the install-time checks
   * (dependency resolution, capability approval, zip hardening are all server-side).
   */
  export function validateManifest(value: unknown): readonly ManifestProblem[];
  /**
   * Does `version` satisfy `range`? Supports exactly what manifests use: `*`,
   * `^x.y`, `^x.y.z`, `~x.y.z`, `>=x.y.z`, and an exact `x.y.z`.
   *
   * Deliberately not a semver library — a dependency in the kernel contract is a
   * dependency in every plugin's bundle, and this is 30 lines. The *server* does the
   * real resolution at install time (SPEC §6.2); this is the loader's boot-time
   * re-check of one version against one range.
   */
  export function satisfies(version: string, range: string): boolean;

  // ---- services.ts ---------------------------------------------
  /**
   * `kernel.services` — the value a plugin's `activate()` returned, available to
   * its dependents (SPEC §6.4).
   *
   * This is the *only* way one plugin calls another: never a direct import, never a
   * module-level side channel (SPEC §6.1). Activation is topologically ordered and
   * reload-only, so by the time your `activate()` runs, every declared dependency
   * has already returned — which is why `require()` can be synchronous and why
   * there is no "wait for plugin X" call to misuse.
   *
   * **FROZEN.**
   */
  export interface ServicesApi {
      /**
       * The API a dependency exported. Throws `ContractViolationError` when
       * `pluginId` is not a **declared** dependency of the caller — undeclared use
       * would make the load order that guarantees it exists a coincidence.
       */
      require<T>(pluginId: string): T;
      /** Like {@link require}, but `undefined` for an optional, absent dependency. */
      get<T>(pluginId: string): T | undefined;
      /** Whether a declared dependency activated successfully. */
      has(pluginId: string): boolean;
      /** Ids of every successfully activated plugin. Read-only introspection. */
      list(): readonly string[];
  }

  // ---- session.ts ----------------------------------------------
  /**
   * `kernel.session` — who is signed in, and the authenticated `fetch` plugins use.
   *
   * The carrier is deliberately invisible: a browser session is a cookie, a Flutter
   * shell session is a bearer token in native secure storage (SPEC §5.2), and a
   * plugin that built its own `fetch` would work in one and silently fail in the
   * other. Use {@link SessionApi.fetch}.
   *
   * **FROZEN.**
   */
  export interface SessionUser {
      readonly id: string;
      readonly email: string;
      readonly name: string | null;
      readonly isAdmin: boolean;
  }
  export type AuthVia = "cookie" | "bearer";
  export interface LogoutOptions {
      /**
       * Logout clears local replicas (shared-device safety, SPEC §5.3) and therefore
       * **blocks while unsynced edits exist**. Pass `true` only after the user has
       * explicitly chosen to discard them.
       */
      readonly discardUnsynced?: boolean;
  }
  export interface SessionApi {
      readonly user: SessionUser;
      readonly via: AuthVia;
      isAdmin(): boolean;
      /**
       * `fetch` against the server API with this session's credentials. `path` is
       * relative to `/api` (`"/documents/01J…"`). Rejects with the unwrapped error
       * envelope (`{error:{code,message}}`) on a non-2xx response.
       */
      fetch(path: string, init?: RequestInit): Promise<Response>;
      /**
       * `fetch` against this plugin's own server routes — `/api/plugins/<this
       * plugin>/…` (SPEC §5.1). The plugin id is supplied by the kernel, so a plugin
       * cannot call another plugin's routes by spelling a different path.
       */
      fetchPlugin(path: string, init?: RequestInit): Promise<Response>;
      /**
       * The session needs re-authentication (close code 4401). **Local data is never
       * cleared on this path** (SPEC §5.3) — the shell shows re-login and resyncs.
       */
      onAuthRequired(listener: () => void): Unsubscribe;
      /** Sign out. Warns and blocks on unsynced edits unless told to discard them. */
      logout(options?: LogoutOptions): Promise<void>;
  }

  // ---- settings.ts ---------------------------------------------
  /**
   * `kernel.settings` — per-user settings, **stored as documents** (SPEC §6.4).
   *
   * There is no settings service, no KV table, no extra endpoint: one document per
   * user, each plugin owning one `%%%` section inside it, written with the section
   * splice helper. That buys sync, offline, conflict merging, history and backup for
   * free, and it is why `set()` is a `Promise` — it goes through the CRDT.
   *
   * **Two consequences documented rather than hidden:**
   *
   * - The workspace is shared (SPEC §2), so **another user can read your settings
   *   document.** Never put a secret in settings. Plugin secrets live in admin
   *   config, encrypted at rest (SPEC §6.2).
   * - Values are YAML scalars, one key per line, so they are shallow by design:
   *   strings, numbers, booleans, null, and flow sequences of those. A nested object
   *   is rejected — serialize it yourself if you must, and expect a human to read it.
   *
   * Each plugin sees only its own namespace; the key space is flat within it.
   *
   * **FROZEN.**
   */
  /** `fm.path` of the per-user settings documents. One document per user. */
  export const SETTINGS_DOC_PATH = ".settings";
  /** What a settings value may be (SPEC §3.3: YAML, one key per line). */
  export type SettingsValue = string | number | boolean | null | readonly CoreValue[];
  export interface SettingsFieldSchema {
      readonly type: "string" | "number" | "boolean" | "enum" | "list";
      readonly label?: string;
      readonly description?: string;
      readonly default?: SettingsValue;
      /** For `type: "enum"`. */
      readonly options?: readonly string[];
  }
  /** Declared per plugin; the `settings` plugin renders it (SPEC §6.5). */
  export type SettingsSchema = Readonly<Record<string, SettingsFieldSchema>>;
  export interface SettingsApi {
      /**
       * Declare this plugin's keys, their types and their defaults. The declared
       * default is what `get` returns for an unset key, which is also how the
       * settings UI knows what to draw without the plugin contributing a widget.
       */
      defineSchema(schema: SettingsSchema): void;
      /** The declared schema, for the settings UI. */
      schema(): SettingsSchema;
      /** Synchronous read of the cached value (the settings document is replicated). */
      get<T extends SettingsValue>(key: string): T | undefined;
      /** Every value in this plugin's namespace, defaults merged in. */
      all(): Readonly<Record<string, SettingsValue>>;
      /** Write one key. One line splice into this plugin's section. */
      set(key: string, value: SettingsValue): Promise<void>;
      /** Remove one key; the declared default applies again. */
      remove(key: string): Promise<void>;
      /** Fires on local writes and on changes that arrive through sync. */
      subscribe(listener: (values: Readonly<Record<string, SettingsValue>>) => void): Unsubscribe;
      /** The backing document's id — `undefined` until it exists. Read-only. */
      readonly documentId: string | undefined;
  }

  // ---- shape.ts ------------------------------------------------
  /**
   * Minimal runtime shape validation for extension points (SPEC §6.4: "schema =
   * minimal runtime shape validation, rejects loudly").
   *
   * Deliberately not a schema library. It answers one question — "does this
   * contribution have the fields the point promised?" — with a path and an
   * expectation per failure, and it costs no dependency and no bundle weight. It
   * validates *shape*, never semantics: a `navbar.item` with an `id` of `""` is
   * shape-valid and the shell's problem.
   *
   * **FROZEN.**
   */
  export interface ShapeIssue {
      /** Dotted path into the contributed value; `""` is the value itself. */
      readonly path: string;
      readonly expected: string;
      readonly got: string;
  }
  /**
   * A shape check for values of `T`.
   *
   * `T` is documentation and the type `definePoint` binds — there is deliberately no
   * phantom field carrying it, so a `Shape` built with `s.object({ icon: s.any() })`
   * can still be handed to a point whose type says `icon?: ReactNode`. Validation is a
   * runtime floor (SPEC §6.4: *minimal* shape validation); the compiler's opinion of a
   * contribution comes from the point's own type, not from the validator.
   */
  export interface Shape<T> {
      readonly name: string;
      /** Empty array ⇒ valid. */
      check(value: unknown, path?: string): readonly ShapeIssue[];
  }
  export const anyValue: <T = unknown>() => Shape<T>;
  export const string: () => Shape<string>;
  export const number: () => Shape<number>;
  export const boolean: () => Shape<boolean>;
  export const func: <F extends (...args: never[]) => unknown>() => Shape<F>;
  /**
   * A React component: a function, or an object produced by `memo`/`forwardRef`/
   * `lazy`. Checked structurally so the kernel never imports React at runtime.
   */
  export const component: <P = unknown>() => Shape<(props: P) => unknown>;
  export const literal: <const V extends string | number | boolean>(...allowed: readonly V[]) => Shape<V>;
  export const array: <T>(item: Shape<T>) => Shape<readonly T[]>;
  export const optional: <T>(inner: Shape<T>) => Shape<T | undefined>;
  export const union: <T>(...members: readonly Shape<unknown>[]) => Shape<T>;
  export const record: <T>(value: Shape<T>) => Shape<Readonly<Record<string, T>>>;
  type FieldsOf<F extends Record<string, Shape<unknown>>> = {
      -readonly [K in keyof F]: F[K] extends Shape<infer T> ? T : never;
  };
  /**
   * An object with the named fields. **Unknown keys are allowed** — a plugin may
   * carry its own extra data on a contribution, and a point that rejected extras
   * would make every point addition a breaking change for contributors.
   */
  export const object: <F extends Record<string, Shape<unknown>>>(fields: F) => Shape<FieldsOf<F>>;
  /** Convenience: the namespace spelling base plugins use (`s.object({ … })`). */
  export const s: {
      readonly any: <T = unknown>() => Shape<T>;
      readonly string: () => Shape<string>;
      readonly number: () => Shape<number>;
      readonly boolean: () => Shape<boolean>;
      readonly func: <F extends (...args: never[]) => unknown>() => Shape<F>;
      readonly component: <P = unknown>() => Shape<(props: P) => unknown>;
      readonly literal: <const V extends string | number | boolean>(...allowed: readonly V[]) => Shape<V>;
      readonly array: <T>(item: Shape<T>) => Shape<readonly T[]>;
      readonly optional: <T>(inner: Shape<T>) => Shape<T | undefined>;
      readonly union: <T>(...members: readonly Shape<unknown>[]) => Shape<T>;
      readonly record: <T>(value: Shape<T>) => Shape<Readonly<Record<string, T>>>;
      readonly object: <F extends Record<string, Shape<unknown>>>(fields: F) => Shape<FieldsOf<F>>;
  };
  export function validate<T>(shape: Shape<T>, value: unknown): readonly ShapeIssue[];
  /** One human-readable line per issue, for the error the kernel throws. */
  export function formatIssues(issues: readonly ShapeIssue[]): string;
  export {};

  // ---- sync.ts -------------------------------------------------
  /**
   * `kernel.sync` — the observable status of SPEC §6.4, and nothing more.
   *
   * It is a *read* surface. Plugins do not drive sync: there is no "sync now", no
   * "subscribe to this document" (that is `documents.open`), and no way to reach the
   * socket. The one imperative is {@link SyncApi.reconnectNow}, which exists because
   * the kernel has no DOM and cannot watch `navigator.onLine` itself.
   *
   * **FROZEN.**
   */
  export type SyncStatus = "offline" | "connecting" | "syncing" | "synced" | "auth-required" | "error";
  /** Progress of a bootstrap pass (cold start or `feed.reset`). */
  export interface BootstrapProgress {
      readonly rows: number;
      readonly total?: number;
      readonly complete: boolean;
  }
  export interface SyncState {
      readonly status: SyncStatus;
      /** The persisted resume point — the server's `safe_seq`, never `max(seq)` seen. */
      readonly safeSeq: number;
      /** Server head, for "N changes behind". */
      readonly headSeq: number;
      /** Local edits the socket has not carried yet. */
      readonly pending: number;
      readonly bootstrap?: BootstrapProgress;
      readonly lastError?: string;
  }
  export interface SyncApi {
      readonly state: SyncState;
      /** Fires immediately with the current state, then on every transition. */
      subscribe(listener: (state: SyncState) => void): Unsubscribe;
      /**
       * Reconnect now, ignoring the backoff. Throttled internally, and a no-op while
       * a socket is up — safe to call from an `online` handler, a visibility change,
       * or a "retry" button.
       */
      reconnectNow(): void;
  }

  // ---- types.ts ------------------------------------------------
  /**
   * Shared primitives of the `@kernel` contract.
   *
   * Everything in `kernel-api/` is the **public, frozen** surface plugins compile
   * against (SPEC §6.4: "Types are the contract"). It holds declarations, a handful
   * of shipped constants (the default theme tokens), the minimal shape validators,
   * and nothing else — no DOM access, no IndexedDB, no sockets. The implementation
   * lives in `kernel/src/runtime/**` and is invisible to plugins.
   *
   * **FROZEN.** Adding an optional field to an options object is the one permitted
   * change without a kernel-major; see `web/CONTRACTS.md`.
   */
  /** Undo a subscription. Idempotent by contract. */
  export type Unsubscribe = () => void;
  /** Undo a registration (a contribution, a token override). Idempotent. */
  export interface Disposable {
      dispose(): void;
  }
  /** An RFC 3339 / ISO-8601 timestamp, exactly as the projection carries it. */
  export type Iso8601 = string;
  /**
   * A value from the shared core's value model (SPEC §3.4) — what frontmatter and
   * `%%%` sections materialize into. Mirrors `CoreValue` in `kernel/src/protocol.ts`;
   * `kernel/src/runtime/contract-parity.ts` fails the typecheck if the two drift.
   */
  export type CoreValue = null | boolean | number | string | readonly CoreValue[] | {
      readonly [key: string]: CoreValue;
  };
  export type CoreMap = {
      readonly [key: string]: CoreValue;
  };
  /** A frontmatter value a plugin may write through the splice helpers. */
  export type FmValue = CoreValue;
  /**
   * Per-plugin logger. Messages are prefixed with the plugin id, so a plugin's
   * noise is always attributable — plugins run unsandboxed (SPEC §6.1) and "which
   * plugin printed this" is the cheapest diagnostic there is.
   */
  export interface KernelLogger {
      debug(message: string, ...detail: readonly unknown[]): void;
      info(message: string, ...detail: readonly unknown[]): void;
      warn(message: string, ...detail: readonly unknown[]): void;
      error(message: string, ...detail: readonly unknown[]): void;
  }

  // ---- ui.ts ---------------------------------------------------
  /**
   * `kernel.ui` — the single mount point, the error-boundary wrapper, the notice
   * strip, and the **default light/dark design tokens the kernel ships** (SPEC §6.4,
   * §6.5 note).
   *
   * Why tokens live in the kernel and not in `themes`: with them in a plugin, a
   * workspace whose `themes` plugin failed to activate — or a `?safe=bare` boot —
   * renders unreadable text on unpainted background, which is exactly the state you
   * are in when you need the plugin manager. The kernel therefore ships one legible,
   * WCAG-AA light and dark palette, and `themes` **overrides** it (SPEC §6.5).
   *
   * Why the kernel owns the error boundary: "every contribution is wrapped in an
   * error boundary" (SPEC §6.4) is a property of the *host*, not a courtesy each
   * plugin author remembers. The loader wraps contributed components with
   * {@link UiApi.boundary}; a plugin rendering another plugin's component wraps it
   * the same way.
   *
   * **FROZEN.**
   */
  /** A CSS custom property the kernel defines a value for. */
  export type ThemeTokenName = "--lm-bg" | "--lm-bg-subtle" | "--lm-bg-raised" | "--lm-bg-overlay" | "--lm-border" | "--lm-border-strong" | "--lm-text" | "--lm-text-muted" | "--lm-text-inverse" | "--lm-link" | "--lm-accent" | "--lm-accent-text" | "--lm-accent-subtle" | "--lm-danger" | "--lm-danger-text" | "--lm-warning" | "--lm-success" | "--lm-focus-ring" | "--lm-selection" | "--lm-shadow-1" | "--lm-shadow-2" | "--lm-font-sans" | "--lm-font-mono" | "--lm-radius" | "--lm-radius-lg" | "--lm-space" | "--lm-tap-target";
  export type ThemeTokens = Readonly<Record<ThemeTokenName, string>>;
  export type ColorScheme = "light" | "dark";
  export type ColorSchemePreference = ColorScheme | "system";
  /**
   * Kernel default **light** tokens. Text/background pairs clear WCAG AA:
   * `--lm-text` on `--lm-bg` ≈ 14.9:1, `--lm-text-muted` ≈ 5.3:1,
   * `--lm-accent-text` on `--lm-accent` ≈ 5.2:1.
   */
  export const DEFAULT_LIGHT_TOKENS: ThemeTokens;
  /**
   * Kernel default **dark** tokens. `--lm-text` on `--lm-bg` ≈ 13.6:1,
   * `--lm-text-muted` ≈ 6.4:1, `--lm-accent-text` on `--lm-accent` ≈ 8.1:1.
   */
  export const DEFAULT_DARK_TOKENS: ThemeTokens;
  /** Every token name, in declaration order. */
  export const THEME_TOKEN_NAMES: readonly ThemeTokenName[];
  export interface ThemeTokensApi {
      readonly names: readonly ThemeTokenName[];
      /** The kernel defaults — what `themes` starts from. */
      defaults(scheme: ColorScheme): ThemeTokens;
      /** The values currently applied to the document. */
      current(): ThemeTokens;
      /**
       * Override tokens for one scheme. Later calls layer on earlier ones; the
       * returned handle removes exactly this layer, so a theme picker never has to
       * reconstruct the base palette.
       */
      apply(scheme: ColorScheme, tokens: Partial<ThemeTokens>): Unsubscribe;
      /** Drop every override, back to the kernel defaults. */
      reset(): void;
  }
  export type NoticeLevel = "info" | "warning" | "error";
  export interface NoticeAction {
      readonly label: string;
      run(): void;
  }
  /**
   * One line in the notice strip. The kernel uses it for the aggregated
   * failed-plugin notice and the single "update available — reload" flow (SPEC §8);
   * plugins use it for anything a user must be told once.
   */
  export interface Notice {
      /** Stable id: re-notifying the same id replaces rather than stacks. */
      readonly id: string;
      readonly level: NoticeLevel;
      readonly message: string;
      readonly detail?: string;
      readonly actions?: readonly NoticeAction[];
      /** Set by the kernel when the notice is about a plugin. */
      readonly pluginId?: string;
  }
  export interface BoundaryInfo {
      /** Which extension point the component was contributed to. */
      readonly point: string;
      /** Owner of the component; defaults to the calling plugin. */
      readonly pluginId?: string;
      /** Rendered in place of the component when it throws; default is a terse chip. */
      readonly fallback?: ComponentType<{
          readonly error: Error;
          readonly pluginId: string;
      }>;
  }
  export interface UiApi {
      /**
       * The one DOM node the app's React root renders into. Plugins do not append to
       * it — {@link mount} is the sanctioned path. Exposed for the rare integration
       * that needs a portal container.
       */
      readonly root: HTMLElement;
      /**
       * Render the application shell. **Single mount** (SPEC §6.4): the first caller
       * owns it — normally `shell-ui` — and a second call while it is held throws
       * `ContractViolationError`. Disposing returns the mount point.
       */
      mount(element: ReactNode): Unsubscribe;
      /** Wrap a contributed component in the kernel's error boundary. */
      boundary<P extends object>(component: ComponentType<P>, info: BoundaryInfo): ComponentType<P>;
      /** Post (or replace) a notice. Disposing removes it. */
      notify(notice: Notice): Unsubscribe;
      notices(): readonly Notice[];
      onNotices(listener: (notices: readonly Notice[]) => void): Unsubscribe;
      readonly tokens: ThemeTokensApi;
      /** The scheme currently painted, after preference and `prefers-color-scheme`. */
      readonly colorScheme: ColorScheme;
      /** The user's preference; `themes` sets it, the kernel persists and resolves it. */
      colorSchemePreference(): ColorSchemePreference;
      setColorSchemePreference(preference: ColorSchemePreference): void;
      onColorScheme(listener: (scheme: ColorScheme) => void): Unsubscribe;
  }
}
