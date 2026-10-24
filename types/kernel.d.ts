/**
 * `@kernel` — the ddd plugin contract.
 *
 * Generated from web/kernel-api/src by web/scripts/build-kernel-dts.mjs.
 * Do not edit: edit the source and re-run `npm run kernel:dts`.
 *
 * Contract version: 4.18.0
 * Served by the server at /kernel.d.ts (SPEC §6.4).
 */

declare module "@kernel" {
  import type * as Y from "yjs";
  import type { ComponentType, ReactNode } from "react";
  import { type ComponentType, type ReactNode } from "react";

  // ---- index.ts ------------------------------------------------
  export const KERNEL_API_VERSION: string;
  export const KERNEL_API_MAJOR: number;

  // ---- actions.ts ----------------------------------------------
  export interface ActionDefinition {
      readonly id: string;
      readonly title: string;
      readonly icon?: string;
      readonly run: (context?: unknown) => void | Promise<void>;
      readonly when?: string;
      readonly enabled?: (context: WhenContext) => boolean;
  }
  export interface ActionInfo {
      readonly id: string;
      readonly title: string;
      readonly icon?: string;
      readonly when?: string;
      readonly pluginId: string;
  }
  export interface WhenContext {
      readonly states?: Iterable<string>;
      readonly element?: Element | null;
  }
  export interface KeybindingInfo {
      readonly keys: string;
      readonly action: string;
      readonly pluginId: string;
  }
  export interface ActionsApi {
      get(id: string): ActionInfo | undefined;
      list(): readonly ActionInfo[];
      keybindings(): readonly KeybindingInfo[];
      visible(id: string, context?: WhenContext): boolean;
      matches(query: string, context?: WhenContext): boolean;
      run(id: string, context?: unknown): Promise<void>;
      subscribe(listener: () => void): Unsubscribe;
  }
  export type WhenMatcher = (query: string) => ((context: WhenContext) => boolean) | undefined;
  export const componentName: (type: string) => string;
  export interface ActionWriter {
      action(pluginId: string, definition: ActionDefinition): Unsubscribe;
      keybinding(pluginId: string, keys: string, actionId: string): Unsubscribe;
  }
  export function installActionWriter(writer: ActionWriter): void;
  export function actionForActivating(definition: ActionDefinition): Unsubscribe;
  export function keybindingForActivating(keys: string, actionId: string): Unsubscribe;

  // ---- capabilities.ts -----------------------------------------
  export const SUPPORTED_BRIDGE_VERSION = 1;
  export type CapabilityName = "filesystem" | "notifications" | "folder" | "clipboard";
  export type CapabilitySupport = "native" | "fallback" | "unavailable";
  export interface FileExport {
      readonly name: string;
      readonly mime: string;
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
      readonly accept?: readonly string[];
      readonly multiple?: boolean;
  }
  export interface FilesystemCapability {
      readonly support: CapabilitySupport;
      export(file: FileExport): Promise<void>;
      pick(options?: PickOptions): Promise<readonly PickedFile[]>;
      exportWorkspace?(): Promise<void>;
  }
  export type NotificationPermissionState = "granted" | "denied" | "default";
  export interface NotificationRequest {
      readonly title: string;
      readonly body?: string;
      readonly tag?: string;
      readonly route?: string;
  }
  export interface NotificationsCapability {
      readonly support: CapabilitySupport;
      permission(): NotificationPermissionState;
      request(): Promise<NotificationPermissionState>;
      notify(notification: NotificationRequest): Promise<void>;
      readonly supportsScheduled: boolean;
      schedule(notification: NotificationRequest, at: number): Promise<string>;
      cancel(id: string): Promise<void>;
      scheduled(): Promise<readonly {
          readonly id: string;
          readonly at: number;
      }[]>;
  }
  export interface FolderEntry {
      readonly path: string;
      readonly kind: "file" | "dir";
      readonly size: number;
      readonly mtimeMs: number;
  }
  export type FolderState = "none" | "ready" | "needs-permission";
  export interface FolderStatus {
      readonly state: FolderState;
      readonly label?: string;
  }
  export interface FolderCapability {
      readonly support: CapabilitySupport;
      readonly watches: boolean;
      status(): Promise<FolderStatus>;
      choose(): Promise<FolderStatus>;
      reconnect(): Promise<FolderStatus>;
      forget(): Promise<void>;
      list(): Promise<readonly FolderEntry[]>;
      read(path: string): Promise<{
          readonly bytes: Uint8Array;
          readonly mtimeMs: number;
      }>;
      write(path: string, bytes: Uint8Array): Promise<{
          readonly mtimeMs: number;
      }>;
      move(from: string, to: string): Promise<void>;
      remove(path: string): Promise<void>;
      onChange(listener: (paths: readonly string[]) => void): () => void;
  }
  export interface ClipboardCapability {
      readonly support: CapabilitySupport;
      readImage(): Promise<File | null>;
  }
  export interface CapabilitiesApi {
      has(name: CapabilityName): boolean;
      support(name: CapabilityName): CapabilitySupport;
      readonly bridgeVersion: number | undefined;
      readonly filesystem: FilesystemCapability;
      readonly notifications: NotificationsCapability;
      readonly folder: FolderCapability;
      readonly clipboard: ClipboardCapability;
      storage(): Promise<StorageReport>;
  }
  export interface StorageReport {
      readonly persisted: boolean;
      readonly usageBytes?: number;
      readonly quotaBytes?: number;
  }

  // ---- contracts.generated.ts ----------------------------------
  export const KERNEL_CONTRACTS: {
      readonly slots: Readonly<Record<string, {
          readonly entry: JsonSchema;
      }>>;
      readonly signals: Readonly<Record<string, {
          readonly schema: JsonSchema;
          readonly response?: JsonSchema;
      }>>;
  };
  export interface GeneratedSlotEntries {
      readonly "kernel.root": {
          readonly "id": string;
          readonly "component": ((...args: never[]) => unknown);
      };
      readonly "kernel.route": {
          readonly "id": string;
          readonly "path": string;
          readonly "component": ((...args: never[]) => unknown);
          readonly "title"?: string;
      };
      readonly "kernel.settings.section": {
          readonly "id": string;
          readonly "title": string;
          readonly "description"?: string;
          readonly "order"?: number;
          readonly "component": ((...args: never[]) => unknown);
      };
      readonly "admin.package-provider": {
          readonly "id": string;
          readonly "title": string;
          readonly "setup": ((...args: never[]) => unknown) | Readonly<Record<string, unknown>>;
          readonly "browse": ((...args: never[]) => unknown);
          readonly "download": ((...args: never[]) => unknown);
          readonly "checkUpdates"?: ((...args: never[]) => unknown);
          readonly "defaults"?: ((...args: never[]) => unknown);
          readonly "validate"?: ((...args: never[]) => unknown);
          readonly "fromLink"?: ((...args: never[]) => unknown);
          readonly "test"?: ((...args: never[]) => unknown);
          readonly "description"?: string;
          readonly "order"?: number;
      };
      readonly "attachments.viewer": {
          readonly "id": string;
          readonly "label": string;
          readonly "extensions": readonly (string)[];
          readonly "component": ((...args: never[]) => unknown) | Readonly<Record<string, unknown>>;
          readonly "order"?: number;
      };
      readonly "commands.documents": {
          readonly "id"?: string;
          readonly "action": string;
      } & {
          readonly id?: string;
      };
      readonly "commands.palette": {
          readonly "id"?: string;
          readonly "action": string;
          readonly "order"?: number;
          readonly "category"?: string;
      } & {
          readonly id?: string;
      };
      readonly "context-menu.item": ({
          readonly "id"?: string;
          readonly "action": string;
          readonly "order"?: number;
          readonly "danger"?: boolean;
          readonly "hint"?: string | ((...args: never[]) => unknown);
          readonly "group"?: string;
          readonly "when"?: string;
          readonly "label"?: string;
      }) | (({
          readonly "id": string;
          readonly "when": string;
          readonly "order"?: number;
          readonly "items": ((...args: never[]) => unknown);
      }) & {
          readonly id?: string;
      });
      readonly "context-menu.group": {
          readonly "id": string;
          readonly "label": string;
          readonly "icon"?: unknown;
          readonly "order"?: number;
          readonly "parent"?: string;
      };
      readonly "document-surface.mode": {
          readonly "id": string;
          readonly "label": string;
          readonly "component": ((...args: never[]) => unknown) | Readonly<Record<string, unknown>>;
          readonly "icon"?: unknown;
          readonly "order"?: number;
          readonly "when"?: ((...args: never[]) => unknown);
          readonly "prefer"?: ((...args: never[]) => unknown);
          readonly "forNew"?: boolean;
      };
      readonly "editor.extension": {
          readonly "id": string;
          readonly "extension": unknown;
          readonly "order"?: number;
      };
      readonly "editor.paste": {
          readonly "id": string;
          readonly "paste": ((...args: never[]) => unknown);
          readonly "order"?: number;
      };
      readonly "editor.surface": {
          readonly "id": string;
          readonly "documentId": string;
          readonly "element": unknown;
          readonly "hasFocus": ((...args: never[]) => unknown);
          readonly "focus": ((...args: never[]) => unknown);
          readonly "textBeforeCaret": ((...args: never[]) => unknown);
          readonly "caretRect": ((...args: never[]) => unknown);
          readonly "takeBeforeCaret": ((...args: never[]) => unknown);
          readonly "subscribe": ((...args: never[]) => unknown);
          readonly "documentBeforeCaret"?: ((...args: never[]) => unknown);
          readonly "replaceBeforeCaret"?: ((...args: never[]) => unknown);
      };
      readonly "markdown.directive": {
          readonly "id": string;
          readonly "name": string;
          readonly "kind": "container" | "leaf" | "text";
          readonly "component": ((...args: never[]) => unknown) | Readonly<Record<string, unknown>>;
      };
      readonly "markdown.fence": {
          readonly "id": string;
          readonly "language"?: string;
          readonly "component": ((...args: never[]) => unknown) | Readonly<Record<string, unknown>>;
          readonly "order"?: number;
      };
      readonly "markdown.component": {
          readonly "id": string;
          readonly "node": string;
          readonly "component": ((...args: never[]) => unknown) | Readonly<Record<string, unknown>>;
          readonly "order"?: number;
      };
      readonly "markdown.remark": {
          readonly "id": string;
          readonly "plugin": unknown;
          readonly "options"?: unknown;
          readonly "order"?: number;
      };
      readonly "markdown.attachment": {
          readonly "id": string;
          readonly "component": ((...args: never[]) => unknown) | Readonly<Record<string, unknown>>;
          readonly "order"?: number;
      };
      readonly "markdown.task-state": {
          readonly "id": string;
          readonly "marker": string;
          readonly "label": string;
          readonly "icon": unknown;
          readonly "order"?: number;
          readonly "done"?: boolean;
          readonly "style"?: unknown;
      };
      readonly "search.provider": {
          readonly "id": string;
          readonly "label": string;
          readonly "order"?: number;
          readonly "search": ((...args: never[]) => unknown);
      };
      readonly "shell-ui.view": {
          readonly "id": string;
          readonly "component": ((...args: never[]) => unknown);
          readonly "title"?: string;
      };
      readonly "shell-ui.overlay": {
          readonly "id": string;
          readonly "component": ((...args: never[]) => unknown);
      };
      readonly "shell-ui.sidebar": {
          readonly "id": string;
          readonly "title": string;
          readonly "component": ((...args: never[]) => unknown);
          readonly "icon"?: unknown;
          readonly "order"?: number;
          readonly "defaultOpen"?: boolean;
          readonly "target"?: {
              readonly "type": string;
              readonly "id"?: string;
          };
      };
      readonly "shell-ui.altbar": {
          readonly "id": string;
          readonly "title": string;
          readonly "component": ((...args: never[]) => unknown);
          readonly "icon"?: unknown;
          readonly "order"?: number;
          readonly "defaultOpen"?: boolean;
          readonly "when"?: ((...args: never[]) => unknown);
      };
      readonly "shell-ui.header": {
          readonly "id": string;
          readonly "component": ((...args: never[]) => unknown);
      };
      readonly "shell-ui.footer": {
          readonly "id": string;
          readonly "component": ((...args: never[]) => unknown);
      };
      readonly "slash-commands.item": {
          readonly "id"?: string;
          readonly "action": string;
          readonly "order"?: number;
          readonly "description"?: string;
          readonly "keywords"?: readonly (string)[];
      } & {
          readonly id?: string;
      };
      readonly "syntax-highlight.language": {
          readonly "id": string;
          readonly "name": string;
          readonly "aliases"?: readonly (string)[];
          readonly "wasmUrl": string;
          readonly "highlightsUrl": string;
          readonly "size"?: number;
      };
      readonly "themes.theme": {
          readonly "id": string;
          readonly "name": string;
          readonly "scheme": "light" | "dark";
          readonly "tokens": {
              readonly [field: string]: string;
          };
      };
      readonly "toolbar.item": ({
          readonly "id"?: string;
          readonly "label"?: string;
          readonly "order"?: number;
          readonly "bar"?: "top" | "bottom";
          readonly "side"?: "start" | "end";
          readonly "mobile"?: {
              readonly "bar"?: "top" | "bottom";
              readonly "side"?: "start" | "end";
          };
          readonly "action": string;
      }) | (({
          readonly "id": string;
          readonly "label": string;
          readonly "order"?: number;
          readonly "bar"?: "top" | "bottom";
          readonly "side"?: "start" | "end";
          readonly "mobile"?: {
              readonly "bar"?: "top" | "bottom";
              readonly "side"?: "start" | "end";
          };
          readonly "icon"?: unknown;
          readonly "onSelect"?: ((...args: never[]) => unknown);
          readonly "component"?: ((...args: never[]) => unknown);
      }) & {
          readonly id?: string;
      });
  }
  export interface GeneratedSignalPayloads {
      readonly "kernel.document.created": {
          readonly "id": string;
          readonly "title"?: string;
      };
      readonly "kernel.document.changed": {
          readonly "id": string;
          readonly "title"?: string;
      };
      readonly "kernel.document.deleted": {
          readonly "id": string;
      };
      readonly "kernel.plugin.failed": {
          readonly "plugin": string;
          readonly "point"?: string;
          readonly "message": string;
      };
      readonly "kernel.sync.changed": {
          readonly "status": string;
          readonly "pending"?: number;
          readonly "safeSeq"?: number;
          readonly "headSeq"?: number;
      };
      readonly "kernel.auth.required": Readonly<Record<string, unknown>>;
      readonly "kernel.storage.warning": {
          readonly "reason": string;
      };
      readonly "kernel.update.available": {
          readonly "kind": "plugins" | "bundle" | "shell";
          readonly "version"?: string | number;
      };
      readonly "doc-events.created": {
          readonly "id": string;
          readonly "parent"?: string;
      };
      readonly "doc-events.announce": {
          readonly "id": string;
          readonly "parent"?: string;
      };
      readonly "folders.changed": Readonly<Record<string, unknown>>;
      readonly "indexer.changed": Readonly<Record<string, unknown>>;
      readonly "markdown.changed": Readonly<Record<string, unknown>>;
      readonly "router.changed": {
          readonly "path": string;
      };
  }
  export interface GeneratedSignalResponses {
      readonly "doc-events.announce": Readonly<Record<string, unknown>>;
  }

  // ---- decorations.ts ------------------------------------------
  export type AttrValue = string | number | boolean | null | undefined;
  export type Attrs = Readonly<Record<string, AttrValue>>;
  export const PSEUDO_STATES: readonly ["readonly", "mobile", "empty", "editing"];
  export type PseudoState = (typeof PSEUDO_STATES)[number];
  export type PseudoStates = Readonly<Record<PseudoState, boolean>>;
  export interface Ancestor {
      readonly name: string;
      readonly attrs: Attrs;
      readonly states: PseudoStates;
  }
  export type Ancestors = Readonly<Record<string, Attrs>>;
  export interface DecorationProps<P = Readonly<Record<string, unknown>>> {
      readonly children: ReactNode;
      readonly attrs: Attrs;
      readonly ancestors: Ancestors;
      readonly props: Readonly<P>;
  }
  export type Wrapper = ComponentType<DecorationProps>;
  export interface DecorationTarget {
      readonly name: string;
      readonly attrs: Attrs;
      readonly states: PseudoStates;
      readonly ancestry: readonly Ancestor[];
  }
  export interface DecorationLink {
      readonly id: number;
      readonly pluginId: string;
      readonly query: string;
      readonly target: string;
      readonly wrapper: Wrapper;
  }
  export interface DecorationInfo {
      readonly pluginId: string;
      readonly query: string;
      readonly target: string;
  }
  export interface DecorationFailure extends DecorationInfo {
      readonly message: string;
  }
  export interface DecorationCache {
      resolve(target: DecorationTarget): readonly DecorationLink[];
  }
  export interface DecorationEngine {
      subscribe(listener: () => void): Unsubscribe;
      version(): number;
      declare(name: string, attrs: Attrs): Attrs | undefined;
      cache(): DecorationCache;
      report(link: DecorationLink, error: Error): void;
  }
  export function installDecorationEngine(engine: DecorationEngine): void;
  export interface DecorationWriter {
      decorate(pluginId: string, query: string, wrapper: Wrapper): Unsubscribe;
  }
  export function installDecorationWriter(writer: DecorationWriter): void;
  export function decorateForActivating(query: string, wrapper: Wrapper): Unsubscribe;
  export function ancestorsOf(ancestry: readonly Ancestor[]): Ancestors;
  export function useAncestors(): Ancestors;
  export interface DecoratableStates {
      readonly readonly?: boolean;
      readonly editing?: boolean;
      readonly empty?: boolean;
  }
  export function decoratable<P extends object>(name: string, Original: ComponentType<P>, attrsOf: (props: P) => Attrs, statesOf?: (props: P) => DecoratableStates): ComponentType<P>;

  // ---- documents.ts --------------------------------------------
  export type DocumentId = string;
  export type FilterJson = {
      readonly [key: string]: unknown;
  };
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
      readonly created_via?: string | null;
      readonly updated_at: Iso8601;
      readonly updated_by: string | null;
      readonly updated_via?: string | null;
      readonly deleted: boolean;
      readonly deleted_at: Iso8601 | null;
      readonly deleted_by: string | null;
      readonly deleted_via?: string | null;
      readonly purged: boolean;
  }
  export interface SearchHit {
      readonly id: DocumentId;
      readonly score: number;
      readonly terms: readonly string[];
  }
  export type DocumentPhase = "hydrating" | "live" | "error" | "released";
  export interface OpenDocument {
      readonly id: DocumentId;
      readonly doc: Y.Doc;
      readonly text: Y.Text;
      readonly phase: DocumentPhase;
      onAwareness(listener: (payload: Uint8Array) => void): Unsubscribe;
      sendAwareness(payload: Uint8Array): void;
      release(): void;
  }
  export interface TextRange {
      readonly start: number;
      readonly end: number;
  }
  export interface TextEdit {
      readonly range: TextRange;
      readonly text: string;
  }
  export interface SectionLineEdit {
      readonly key: string;
      readonly value: FmValue | null;
      readonly remove?: boolean;
  }
  export type ListAction = {
      readonly action: "push";
      readonly value: FmValue;
  } | {
      readonly action: "insert";
      readonly index: number;
      readonly value: FmValue;
  } | {
      readonly action: "remove";
      readonly value: FmValue;
  } | {
      readonly action: "pop";
  };
  export interface ListPlan {
      readonly edits: readonly TextEdit[];
      readonly popped?: FmValue;
  }
  export type SpliceTarget = DocumentId | OpenDocument;
  export interface DocumentSpliceApi {
      setFrontmatterValue(target: SpliceTarget, key: string, value: FmValue): Promise<void>;
      removeFrontmatterKey(target: SpliceTarget, key: string): Promise<void>;
      spliceSection(target: SpliceTarget, edits: readonly SectionLineEdit[]): Promise<void>;
      removeSection(target: SpliceTarget): Promise<void>;
      frontmatterList(target: SpliceTarget, key: string, action: ListAction): Promise<FmValue | undefined>;
      sectionList(target: SpliceTarget, key: string, action: ListAction): Promise<FmValue | undefined>;
      planFrontmatterValue(text: string, key: string, value: FmValue | null): readonly TextEdit[];
      planSection(text: string, edits: readonly SectionLineEdit[]): readonly TextEdit[];
      planFrontmatterList(text: string, key: string, action: ListAction): ListPlan;
      planSectionList(text: string, key: string, action: ListAction): ListPlan;
      apply(target: OpenDocument, edits: readonly TextEdit[], origin?: unknown): void;
  }
  export interface CreateDocumentInput {
      readonly id?: DocumentId;
      readonly text: string;
  }
  export interface DocumentsApi {
      get(id: DocumentId): Promise<DocumentRow | undefined>;
      text(id: DocumentId): Promise<string | undefined>;
      open(id: DocumentId): Promise<OpenDocument>;
      create(input: CreateDocumentInput): Promise<DocumentId>;
      delete(id: DocumentId): Promise<void>;
      restore(id: DocumentId): Promise<void>;
      readonly splice: DocumentSpliceApi;
  }

  // ---- errors.ts -----------------------------------------------
  export class KernelError extends Error {
      readonly detail?: Readonly<Record<string, unknown>> | undefined;
      constructor(message: string, detail?: Readonly<Record<string, unknown>> | undefined);
  }
  export class ContractViolationError extends KernelError {
  }
  export class PluginError extends KernelError {
      readonly pluginId: string;
      readonly cause?: unknown | undefined;
      constructor(pluginId: string, message: string, cause?: unknown | undefined);
  }
  export class CapabilityUnavailableError extends KernelError {
      readonly capability: string;
      constructor(capability: string, reason: string);
  }
  export class CoreUnavailableError extends KernelError {
  }
  export class NotImplementedError extends KernelError {
  }
  export function notImplemented(what: string): never;
  export class SearchPlanError extends KernelError {
      readonly kind: string;
      constructor(kind: string, message: string);
  }
  export class SearchUnavailableError extends KernelError {
      readonly cause?: unknown | undefined;
      constructor(message: string, cause?: unknown | undefined);
  }

  // ---- events.ts -----------------------------------------------
  export const KERNEL_EVENT_PREFIX = "kernel:";
  export const KernelEvents: {
      readonly pluginFailed: "kernel:plugin-failed";
      readonly updateAvailable: "kernel:update-available";
      readonly syncChanged: "kernel:sync-changed";
      readonly authRequired: "kernel:auth-required";
      readonly storageWarning: "kernel:storage-warning";
  };
  export type KernelEventName = (typeof KernelEvents)[keyof typeof KernelEvents];
  export type EventOrigin = {
      readonly kind: "kernel";
  } | {
      readonly kind: "plugin";
      readonly id: string;
  } | {
      readonly kind: "server";
      readonly plugin: string;
  };
  export interface KernelEvent<P = unknown> {
      readonly type: string;
      readonly payload: P;
      readonly origin: EventOrigin;
      readonly at: number;
  }
  export interface EventsApi {
      emit<P>(type: string, payload?: P): void;
      on<P>(type: string, listener: (event: KernelEvent<P>) => void): Unsubscribe;
      once<P>(type: string, listener: (event: KernelEvent<P>) => void): Unsubscribe;
      onAny(listener: (event: KernelEvent) => void): Unsubscribe;
  }

  // ---- json-schema.ts ------------------------------------------
  export interface JsonSchema {
      readonly $ref?: string;
      readonly $defs?: Readonly<Record<string, JsonSchema>>;
      readonly type?: string | readonly string[];
      readonly enum?: readonly unknown[];
      readonly const?: unknown;
      readonly properties?: Readonly<Record<string, JsonSchema>>;
      readonly required?: readonly string[];
      readonly additionalProperties?: boolean | JsonSchema;
      readonly items?: JsonSchema;
      readonly oneOf?: readonly JsonSchema[];
      readonly anyOf?: readonly JsonSchema[];
      readonly allOf?: readonly JsonSchema[];
      readonly minLength?: number;
      readonly maxLength?: number;
      readonly pattern?: string;
      readonly minimum?: number;
      readonly maximum?: number;
      readonly minItems?: number;
      readonly maxItems?: number;
      readonly "x-ddd-note"?: boolean;
  }
  export function validateJson(schema: JsonSchema, value: unknown): readonly string[];

  // ---- kernel.ts -----------------------------------------------
  export interface CoreApi {
      parseDocument(text: string): ParsedText;
      resolveTitle(text: string): string;
      normalizeDate(input: string): string;
      semanticsVersion(): number;
  }
  export interface ParseDiagnostic {
      readonly kind: string;
      readonly line: number;
      readonly key: string | null;
      readonly message: string;
  }
  export interface ParsedText {
      readonly title: string;
      readonly fm: CoreMap;
      readonly plugins: CoreMap;
      readonly fm_parse_error: boolean;
      readonly diagnostics: readonly ParseDiagnostic[];
  }
  export type BootMode = "normal" | "safe" | "bare";
  export interface KernelInfo {
      readonly apiVersion: string;
      readonly bundleVersion: string;
      readonly bootMode: BootMode;
      readonly shell: boolean;
  }
  export interface Kernel {
      readonly info: KernelInfo;
      readonly pluginId: string;
      readonly manifest: PluginManifest;
      readonly documents: DocumentsApi;
      readonly search: SearchApi;
      readonly plugins: PluginsApi;
      readonly events: EventsApi;
      readonly settings: SettingsApi;
      readonly session: SessionApi;
      readonly sync: SyncApi;
      readonly ui: UiApi;
      readonly capabilities: CapabilitiesApi;
      readonly core: CoreApi;
      readonly recurrence: RecurrenceApi;
      readonly log: KernelLogger;
      fill<S extends string>(slot: S, entry: SlotEntryOf<S>): Unsubscribe;
      slot<S extends string>(name: S): SlotList<SlotEntryOf<S>>;
      decorate(query: string, wrapper: Wrapper): void;
      emit<S extends string>(name: S, payload: SignalPayloadOf<S>, options?: EmitOptions): void;
      on<S extends string>(name: S, listener: (payload: SignalPayloadOf<S>, meta: SignalMeta) => void): Unsubscribe;
      handle<S extends string>(name: S, handler: (payload: SignalPayloadOf<S>) => SignalResponseOf<S> | Promise<SignalResponseOf<S>>): Unsubscribe;
      request<S extends string>(name: S, payload: SignalPayloadOf<S>, options?: RequestOptions): Promise<SignalResponseOf<S>>;
      readonly contracts: ContractsApi;
      action(definition: ActionDefinition): void;
      keybinding(keys: string, actionId: string): void;
      readonly actions: ActionsApi;
  }
  export interface LoadedPlugin {
      readonly id: string;
      readonly version: string;
      readonly provides?: string;
      readonly name?: string;
      readonly config?: PluginManifest["config"];
  }
  export interface PluginsApi {
      active(id: string): boolean;
      optional<M>(id: string): Promise<M | undefined>;
      list(): readonly LoadedPlugin[];
  }
  export type ActivateFn = (kernel: Kernel) => unknown | Promise<unknown>;
  export type DeactivateFn = () => void | Promise<void>;
  export interface PluginModule {
      readonly default: ActivateFn;
      readonly deactivate?: DeactivateFn;
  }

  // ---- manifest.ts ---------------------------------------------
  export const PLUGIN_ID_PATTERN: RegExp;
  export const CONTRACT_NAME_PATTERN: RegExp;
  export const SCOPE_PATTERN: RegExp;
  export const PLUGIN_VERSION_PATTERN: RegExp;
  export type PluginState = "enabled" | "disabled" | "pending" | "failed";
  export interface InstalledPlugin {
      readonly manifest: PluginManifest;
      readonly baseUrl: string;
      readonly state: PluginState;
      readonly base: boolean;
      readonly assetsVersion?: string;
  }
  export interface PluginLoad {
      readonly normal: readonly string[];
      readonly safe: readonly string[];
      readonly skipped: readonly {
          readonly id: string;
          readonly reason: string;
      }[];
  }
  export interface ManifestProblem {
      readonly field: string;
      readonly message: string;
  }
  export function validateManifest(value: unknown): readonly ManifestProblem[];
  export const KERNEL_CONTRACT_PREFIX = "kernel.";
  export function namespaceProblem(pluginId: string, name: string, provides?: string): string | undefined;
  export function isManifest(value: unknown): value is PluginManifest;
  export function formatProblem(format: string, text: string): string | undefined;
  export function isValidVersion(version: string): boolean;
  export function isSemverRange(range: string): boolean;
  export function isSafeRelativePath(path: string): boolean;
  export function parsePluginRef(text: string): {
      readonly id: string;
      readonly version: string;
  } | undefined;
  export function satisfies(version: string, range: string): boolean;

  // ---- manifest.generated.ts -----------------------------------
  export const MANIFEST_KERNEL_VERSION = "4.18.0";
  export interface PluginFrontend {
      readonly module: string;
      readonly style?: string;
  }
  export interface PluginCapabilities {
      readonly documents?: readonly ("read" | "write")[];
      readonly http?: HttpCapability;
      readonly tcp?: TcpCapability;
      readonly notifications?: boolean;
      readonly "workspace-signals"?: boolean;
      readonly "public-routes"?: readonly (string)[];
  }
  export interface HttpCapability {
      readonly hosts: readonly (string)[];
  }
  export interface TcpCapability {
      readonly hosts: readonly (string)[];
  }
  export interface PluginConfigField {
      readonly type: "string" | "number" | "boolean" | "select" | "array";
      readonly secret?: boolean;
      readonly label?: string;
      readonly description?: string;
      readonly default?: unknown;
      readonly required?: boolean;
      readonly options?: readonly (string)[];
      readonly items?: "string" | "number" | "boolean" | "select";
  }
  export interface PluginBackend {
      readonly module: string;
      readonly hooks?: readonly ("document.created" | "document.changed" | "document.deleted")[];
      readonly cron?: readonly (string)[];
      readonly routes?: readonly (RouteDeclaration)[];
      readonly scopes?: Readonly<Record<string, string>>;
      readonly events?: readonly (string)[];
      readonly signals?: readonly (string)[];
      readonly exports?: Readonly<Record<string, BackendExport>>;
  }
  export interface RouteDeclaration {
      readonly route: string;
      readonly scope: string;
      readonly stream?: boolean;
  }
  export interface BackendExport {
      readonly input?: unknown;
      readonly output?: unknown;
      readonly description?: string;
  }
  export interface PluginSlot {
      readonly entry: unknown;
  }
  export interface PluginSignal {
      readonly schema: unknown;
      readonly response?: unknown;
  }
  export interface PluginComponent {
      readonly attrs: Readonly<Record<string, unknown>>;
  }
  export interface PluginManifest {
      readonly id: string;
      readonly version: string;
      readonly kernel: string;
      readonly dependencies?: Readonly<Record<string, string>>;
      readonly optionalDependencies?: Readonly<Record<string, string>>;
      readonly provides?: string;
      readonly peerLibraries?: Readonly<Record<string, string>>;
      readonly frontend?: PluginFrontend;
      readonly capabilities?: PluginCapabilities;
      readonly config?: Readonly<Record<string, PluginConfigField>>;
      readonly slots?: Readonly<Record<string, PluginSlot>>;
      readonly signals?: Readonly<Record<string, PluginSignal>>;
      readonly components?: Readonly<Record<string, PluginComponent>>;
      readonly uses?: readonly (string)[];
      readonly backend?: PluginBackend;
      readonly name?: string;
      readonly description?: string;
      readonly author?: string;
      readonly license?: string;
      readonly [extension: `x-${string}`]: unknown;
  }
  export const MANIFEST_SCHEMA: ManifestSchemaNode;
  export interface ManifestSchemaNode {
      readonly $ref?: string;
      readonly type?: "object" | "array" | "string" | "number" | "integer" | "boolean";
      readonly required?: readonly string[];
      readonly properties?: Readonly<Record<string, ManifestSchemaNode>>;
      readonly additionalProperties?: ManifestSchemaNode | boolean;
      readonly propertyNames?: {
          readonly format?: string;
      };
      readonly items?: ManifestSchemaNode;
      readonly enum?: readonly unknown[];
      readonly format?: string;
      readonly minimum?: number;
      readonly $defs?: Readonly<Record<string, ManifestSchemaNode>>;
      readonly "x-removed"?: Readonly<Record<string, string>>;
  }

  // ---- recurrence.ts -------------------------------------------
  export interface RecurrenceExpandRequest {
      readonly rule: string;
      readonly anchor: string;
      readonly end?: string;
      readonly except?: readonly string[];
      readonly dates?: readonly string[];
      readonly from: string;
      readonly to: string;
  }
  export interface RecurrenceNextRequest {
      readonly rule: string;
      readonly anchor: string;
      readonly after: string;
      readonly fromCompletion?: boolean;
      readonly except?: readonly string[];
      readonly dates?: readonly string[];
  }
  export interface RecurrenceOccurrence {
      readonly start: string;
      readonly end?: string;
  }
  export interface RecurrenceProblem {
      readonly ok: false;
      readonly error: string;
  }
  export type RecurrenceCheck = {
      readonly ok: true;
  } | RecurrenceProblem;
  export type RecurrenceExpansion = {
      readonly ok: true;
      readonly occurrences: readonly RecurrenceOccurrence[];
      readonly truncated: boolean;
  } | RecurrenceProblem;
  export type RecurrenceNext = {
      readonly ok: true;
      readonly next: string | null;
  } | RecurrenceProblem;
  export interface RecurrenceApi {
      validate(rule: string): RecurrenceCheck;
      expand(request: RecurrenceExpandRequest): RecurrenceExpansion;
      next(request: RecurrenceNextRequest): RecurrenceNext;
  }

  // ---- registry.ts ---------------------------------------------
  export interface RegistryEntry<T> {
      readonly value: T;
      readonly pluginId: string;
  }
  export interface Registry<T> {
      add(items: T | readonly T[]): () => void;
      get(): readonly T[];
      entries(): readonly RegistryEntry<T>[];
      subscribe(listener: (values: readonly T[]) => void): Unsubscribe;
  }
  export interface RegistryOptions<T> {
      readonly key?: (item: T) => string;
      readonly order?: (item: T) => number;
      readonly shape?: Shape<unknown>;
  }
  export const activatingPlugin: () => string | undefined;
  export function createRegistry<T>(options?: RegistryOptions<T>): Registry<T>;
  export function checked<F extends (...args: never[]) => unknown>(shape: Shape<unknown>, impl: F): F;

  // ---- search.ts -----------------------------------------------
  export type SearchSourceName = "documents" | "fm" | "links" | "tasks" | "attachments";
  export interface SearchDocumentColumns {
      readonly id: string;
      readonly title: string;
      readonly content: string;
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
      readonly purged: boolean;
      readonly words: number;
      readonly characters: number;
      readonly outgoing: readonly string[];
      readonly incoming: readonly string[];
      readonly outgoing_count: number;
      readonly incoming_count: number;
  }
  export type SearchDocumentRow = Omit<SearchDocumentColumns, "content" | "words" | "characters" | "outgoing" | "incoming" | "outgoing_count" | "incoming_count">;
  export interface SearchFmColumns {
      readonly key: string;
      readonly value: FmValue;
      readonly kind: "string" | "number" | "boolean" | "date" | "null";
      readonly position: number | null;
  }
  export interface SearchLinkColumns {
      readonly target: string;
      readonly kind: "link" | "embed" | "frontmatter";
      readonly key: string | null;
      readonly count: number;
      readonly state: "live" | "trashed" | "missing";
  }
  export interface SearchTaskColumns {
      readonly line: number;
      readonly state: "open" | "done" | "other";
      readonly marker: string;
      readonly text: string;
  }
  export interface SearchAttachmentColumns {
      readonly attachment: string;
      readonly line: number;
  }
  export interface SearchSourceColumns {
      readonly documents: SearchDocumentColumns;
      readonly fm: SearchFmColumns;
      readonly links: SearchLinkColumns;
      readonly tasks: SearchTaskColumns;
      readonly attachments: SearchAttachmentColumns;
  }
  type Prefixed<P extends string, T> = {
      readonly [K in keyof T & string as `${P}${K}`]: T[K];
  };
  export type SearchColumnsOf<S extends SearchSourceName> = S extends "documents" ? SearchDocumentColumns : SearchSourceColumns[S] & Prefixed<"doc.", SearchDocumentColumns>;
  export type SearchDefaultRow<S extends SearchSourceName> = S extends "documents" ? SearchDocumentRow : Omit<SearchSourceColumns[S], never> & {
      readonly doc: SearchDocumentRow;
  };
  type OpenField<S extends SearchSourceName> = S extends "documents" ? `fm.${string}` | `plugins.${string}` : `doc.fm.${string}` | `doc.plugins.${string}`;
  export type SearchScope = object;
  export type SearchField<C extends SearchScope, O extends string> = (keyof C & string) | O;
  export type SearchFieldType<C extends SearchScope, F extends string> = F extends keyof C ? C[F] : FmValue;
  export type SearchSortKey<C extends SearchScope, O extends string> = SearchField<C, O> | `-${SearchField<C, O>}` | "relevance" | "-relevance";
  export type SearchCompareOp = "eq" | "ne" | "lt" | "lte" | "gt" | "gte";
  export type SearchOp = SearchCompareOp | "in" | "contains" | "contains_any" | "any" | "every" | "text_contains" | "text_starts_with" | "text_ends_with" | "missing" | "exists" | "is_null" | "child_of" | "parent_of";
  export interface SearchDateLiteral {
      readonly date: string;
  }
  export type SearchLiteral = string | number | boolean | null | Date | SearchDateLiteral;
  type Valueless = "missing" | "exists" | "is_null";
  export type SearchValue<Op extends SearchOp, T> = Op extends SearchCompareOp ? T | SearchLiteral : Op extends "in" ? readonly SearchLiteral[] | SearchSubquery : Op extends "contains_any" ? readonly SearchLiteral[] : Op extends "any" | "every" ? SearchLiteral | readonly [SearchCompareOp, SearchLiteral] : Op extends "child_of" | "parent_of" | "text_contains" | "text_starts_with" | "text_ends_with" ? string : SearchLiteral;
  declare const condition: unique symbol;
  export interface SearchCondition {
      readonly [condition]: true;
  }
  export interface SearchExpression<C extends SearchScope, O extends string> {
      <F extends SearchField<C, O>, Op extends Valueless>(field: F, op: Op): SearchCondition;
      <F extends SearchField<C, O>, Op extends Exclude<SearchOp, Valueless | "child_of">>(field: F, op: Op, value: SearchValue<Op, SearchFieldType<C, F>>): SearchCondition;
      <F extends SearchField<C, O>>(field: F, op: "child_of", value: string, options?: {
          readonly deep?: boolean;
      }): SearchCondition;
      and(...conditions: readonly SearchCondition[]): SearchCondition;
      or(...conditions: readonly SearchCondition[]): SearchCondition;
      not(condition: SearchCondition): SearchCondition;
  }
  declare const textExpression: unique symbol;
  export interface SearchTextExpression {
      readonly [textExpression]: true;
  }
  export interface SearchMatch {
      term(word: string): SearchTextExpression;
      phrase(words: string): SearchTextExpression;
      prefix(start: string): SearchTextExpression;
      and(...expressions: readonly SearchTextExpression[]): SearchTextExpression;
      or(...expressions: readonly SearchTextExpression[]): SearchTextExpression;
      not(expression: SearchTextExpression): SearchTextExpression;
      in(field: "title" | "content" | "fm", expression: SearchTextExpression): SearchTextExpression;
  }
  export interface SearchSnippet {
      readonly text: string;
      readonly ranges: readonly {
          readonly start: number;
          readonly end: number;
      }[];
      readonly line: number;
  }
  export interface SearchHitInfo {
      readonly score: number;
      readonly terms: readonly string[];
  }
  export interface SearchResultOptions {
      readonly total: boolean;
  }
  export type SearchResult<Row, Opts extends SearchResultOptions = {
      readonly total: false;
  }> = {
      readonly rows: readonly Row[];
      readonly nextCursor?: string;
      readonly hits?: Readonly<Record<string, SearchHitInfo>>;
  } & (Opts["total"] extends true ? {
      readonly total: number;
  } : Opts["total"] extends false ? {
      readonly total?: undefined;
  } : {
      readonly total?: number;
  });
  export interface SearchWindow {
      readonly start: number;
      readonly count: number;
  }
  export interface SearchWatchOptions {
      readonly window?: SearchWindow;
  }
  export interface SearchWatch<Row, Opts extends SearchResultOptions = {
      readonly total: false;
  }> {
      readonly result: Omit<SearchResult<Row, Opts>, "total"> & {
          readonly total: number;
          readonly start: number;
      };
      onChange(listener: (result: SearchResult<Row, Opts>) => void): () => void;
      window(start: number, count: number): Promise<void>;
      close(): void;
  }
  export type SearchPlanJson = {
      readonly source?: SearchSourceName;
      readonly stages?: readonly unknown[];
  };
  export interface SearchSubquery {
      plan(): SearchPlanJson;
  }
  type Simplify<T> = {
      readonly [K in keyof T]: T[K];
  } & {};
  type UnionToIntersection<U> = (U extends unknown ? (value: U) => void : never) extends (value: infer I) => void ? I : never;
  export type SearchSelectItem<C extends SearchScope, O extends string> = SearchField<C, O> | {
      readonly [alias: string]: SearchField<C, O>;
  };
  type SelectedOne<C extends SearchScope, Item> = Item extends string ? {
      readonly [K in Item]: SearchFieldType<C, Item>;
  } : Item extends {
      readonly [alias: string]: string;
  } ? {
      readonly [K in keyof Item]: SearchFieldType<C, Item[K]>;
  } : never;
  export type SearchSelected<C extends SearchScope, Items extends readonly unknown[]> = Simplify<UnionToIntersection<SelectedOne<C, Items[number]>>>;
  type Grouped<C extends SearchScope, Fields extends readonly string[]> = Simplify<{
      readonly [K in Fields[number]]: SearchFieldType<C, K>;
  }>;
  type With<T, K extends string, V> = Simplify<T & {
      readonly [P in K]: V;
  }>;
  export interface SearchAggregateState<C, O extends string, R> {
      readonly scope: C;
      readonly open: O;
      readonly rows: R;
  }
  type AggScope<G, C extends SearchScope> = [G] extends [never] ? C : G extends SearchAggregateState<infer Scope extends SearchScope, string, unknown> ? Scope : never;
  type AggOpen<G, O extends string> = [G] extends [never] ? O : G extends SearchAggregateState<object, infer Open, unknown> ? Open : never;
  type AggRows<G> = [G] extends [never] ? {} : G extends SearchAggregateState<object, string, infer Rows> ? Rows : never;
  type AfterAggregate<S extends SearchSourceName, C extends SearchScope, O extends string, G, A extends string, V, Opts extends SearchResultOptions> = SearchBuilder<S, With<AggRows<G>, A, V>, With<AggRows<G>, A, V>, never, SearchAggregateState<AggScope<G, C>, AggOpen<G, O>, With<AggRows<G>, A, V>>, Opts>;
  export type SearchMapKey<C extends SearchScope> = {
      [K in keyof C & string]: C[K] extends CoreMap ? `${K}.${string}` : never;
  }[keyof C & string];
  export interface SearchFuzzyOptions {
      readonly fields?: readonly ("title" | "content" | "fm")[];
      readonly limit?: number;
      readonly maxDistance?: number;
  }
  export interface SearchBuilder<S extends SearchSourceName, C extends SearchScope, Row, O extends string, G, Opts extends SearchResultOptions> {
      text(query: string): SearchBuilder<S, With<C, "relevance", number>, Row, O, never, Opts>;
      match(build: (m: SearchMatch) => SearchTextExpression): SearchBuilder<S, With<C, "relevance", number>, Row, O, never, Opts>;
      where<F extends SearchField<C, O>, Op extends Valueless>(field: F, op: Op): SearchBuilder<S, C, Row, O, never, Opts>;
      where<F extends SearchField<C, O>, Op extends Exclude<SearchOp, Valueless | "child_of">>(field: F, op: Op, value: SearchValue<Op, SearchFieldType<C, F>>): SearchBuilder<S, C, Row, O, never, Opts>;
      where<F extends SearchField<C, O>>(field: F, op: "child_of", value: string, options?: {
          readonly deep?: boolean;
      }): SearchBuilder<S, C, Row, O, never, Opts>;
      where(build: (w: SearchExpression<C, O>) => SearchCondition): SearchBuilder<S, C, Row, O, never, Opts>;
      sort(...keys: readonly SearchSortKey<C, O>[]): SearchBuilder<S, C, Row, O, never, Opts>;
      select<const Items extends readonly SearchSelectItem<C, O>[]>(...items: Items): SearchBuilder<S, SearchSelected<C, Items>, SearchSelected<C, Items>, never, never, Opts>;
      distinct(): SearchBuilder<S, C, Row, O, never, Opts>;
      distinct<const Fields extends readonly SearchField<C, O>[]>(...fields: Fields): SearchBuilder<S, Grouped<C, Fields>, Grouped<C, Fields>, never, never, Opts>;
      groupBy<const Fields extends readonly SearchField<C, O>[]>(...fields: Fields): SearchGroupStart<S, C, O, Grouped<C, Fields>, Opts>;
      count<const A extends string = "count">(as?: A): AfterAggregate<S, C, O, G, A, number, Opts>;
      sum<F extends SearchField<AggScope<G, C>, AggOpen<G, O>>, const A extends string = "sum">(field: F, as?: A): AfterAggregate<S, C, O, G, A, number | null, Opts>;
      avg<F extends SearchField<AggScope<G, C>, AggOpen<G, O>>, const A extends string = "avg">(field: F, as?: A): AfterAggregate<S, C, O, G, A, number | null, Opts>;
      min<F extends SearchField<AggScope<G, C>, AggOpen<G, O>>, const A extends string = "min">(field: F, as?: A): AfterAggregate<S, C, O, G, A, SearchFieldType<AggScope<G, C>, F> | null, Opts>;
      max<F extends SearchField<AggScope<G, C>, AggOpen<G, O>>, const A extends string = "max">(field: F, as?: A): AfterAggregate<S, C, O, G, A, SearchFieldType<AggScope<G, C>, F> | null, Opts>;
      collect<F extends SearchField<AggScope<G, C>, AggOpen<G, O>>, const A extends string = "collect">(field: F, as?: A): AfterAggregate<S, C, O, G, A, SearchFieldType<AggScope<G, C>, F>[], Opts>;
      limit(n: number): SearchBuilder<S, C, Row, O, never, Opts>;
      offset(n: number): SearchBuilder<S, C, Row, O, never, Opts>;
      cursor(cursor: string): SearchBuilder<S, C, Row, O, never, Opts>;
      withTotal(): SearchBuilder<S, C, Row, O, never, {
          readonly total: true;
      }>;
      withContent(): SearchBuilder<S, C, S extends "documents" ? With<Row, "content", string> : Row, O, never, Opts>;
      snippets(): SearchBuilder<S, C, With<Row, "snippet", SearchSnippet | null>, O, never, Opts>;
      trash(scope: "live" | "trashed" | "all"): SearchBuilder<S, C, Row, O, G, Opts>;
      fuzzy(query: string, options?: SearchFuzzyOptions): SearchBuilder<S, With<C, "score", number>, Row, O, never, Opts>;
      map(from: SearchMapKey<C>, to: SearchMapKey<C>): SearchBuilder<S, C, Row, O, never, Opts>;
      map(mapping: Readonly<Partial<Record<SearchMapKey<C>, SearchMapKey<C>>>>): SearchBuilder<S, C, Row, O, never, Opts>;
      run(): Promise<SearchResult<Row, Opts>>;
      watch(options?: SearchWatchOptions): Promise<SearchWatch<Row, Opts>>;
      plan(): SearchPlanJson;
  }
  export type SearchGroupStart<S extends SearchSourceName, C extends SearchScope, O extends string, G, Opts extends SearchResultOptions> = Pick<SearchBuilder<S, C, G, O, SearchAggregateState<C, O, G>, Opts>, "count" | "sum" | "avg" | "min" | "max" | "collect">;
  export type SearchFrom<S extends SearchSourceName> = SearchBuilder<S, SearchColumnsOf<S>, SearchDefaultRow<S>, OpenField<S>, never, {
      readonly total: false;
  }>;
  export type AnySearchRow = Readonly<Record<string, unknown>>;
  export interface AnySearchBuilder {
      text(query: string): AnySearchBuilder;
      match(build: (m: SearchMatch) => SearchTextExpression): AnySearchBuilder;
      where(field: string, op: SearchOp, value?: unknown, options?: {
          readonly deep?: boolean;
      }): AnySearchBuilder;
      where(build: (w: SearchExpression<object, string>) => SearchCondition): AnySearchBuilder;
      sort(...keys: readonly string[]): AnySearchBuilder;
      select(...items: readonly (string | {
          readonly [alias: string]: string;
      })[]): AnySearchBuilder;
      distinct(...fields: readonly string[]): AnySearchBuilder;
      groupBy(...fields: readonly string[]): AnySearchBuilder;
      count(as?: string): AnySearchBuilder;
      sum(field: string, as?: string): AnySearchBuilder;
      avg(field: string, as?: string): AnySearchBuilder;
      min(field: string, as?: string): AnySearchBuilder;
      max(field: string, as?: string): AnySearchBuilder;
      collect(field: string, as?: string): AnySearchBuilder;
      limit(n: number): AnySearchBuilder;
      offset(n: number): AnySearchBuilder;
      cursor(cursor: string): AnySearchBuilder;
      withTotal(): AnySearchBuilder;
      withContent(): AnySearchBuilder;
      snippets(): AnySearchBuilder;
      trash(scope: "live" | "trashed" | "all"): AnySearchBuilder;
      fuzzy(query: string, options?: SearchFuzzyOptions): AnySearchBuilder;
      map(from: string, to: string): AnySearchBuilder;
      map(mapping: {
          readonly [from: string]: string;
      }): AnySearchBuilder;
      run(): Promise<SearchResult<AnySearchRow, SearchResultOptions>>;
      watch(options?: SearchWatchOptions): Promise<SearchWatch<AnySearchRow, SearchResultOptions>>;
      plan(): SearchPlanJson;
  }
  export interface SearchExecutor {
      run(plan: SearchPlanJson): Promise<SearchResult<unknown, SearchResultOptions>>;
      watch(plan: SearchPlanJson, options?: SearchWatchOptions): Promise<SearchWatch<unknown, SearchResultOptions>>;
  }
  export type SearchValueKind = "text" | "reference" | "number" | "boolean" | "date" | "null";
  export interface SearchFieldInfo {
      readonly field: string;
      readonly kinds: readonly SearchValueKind[];
      readonly list: boolean;
      readonly builtIn: boolean;
      readonly documents?: number;
  }
  export interface SearchFieldsOptions {
      readonly includeMachine?: boolean;
  }
  export interface SearchFieldsWatch {
      readonly fields: readonly SearchFieldInfo[];
      onChange(listener: (fields: readonly SearchFieldInfo[]) => void): () => void;
      close(): void;
  }
  export interface SearchApi {
      from(): SearchFrom<"documents">;
      from<S extends SearchSourceName>(source: S): SearchFrom<S>;
      fromPlan(plan: SearchPlanJson): AnySearchBuilder;
      fromAny(source?: SearchSourceName): AnySearchBuilder;
      fields(options?: SearchFieldsOptions): Promise<readonly SearchFieldInfo[]>;
      watchFields(options?: SearchFieldsOptions): Promise<SearchFieldsWatch>;
  }
  export const SEARCH_BUILT_IN_FIELDS: readonly SearchFieldInfo[];
  type FieldRow = Readonly<Record<string, unknown>>;
  export function searchFieldsOf(kinds: readonly FieldRow[], counts: readonly FieldRow[], references?: readonly FieldRow[], texts?: readonly FieldRow[]): readonly SearchFieldInfo[];
  export function createSearchApi(executor: SearchExecutor): SearchApi;
  export {};

  // ---- session.ts ----------------------------------------------
  export interface SessionUser {
      readonly id: string;
      readonly email: string;
      readonly name: string | null;
      readonly isAdmin: boolean;
  }
  export type AuthVia = "cookie" | "bearer";
  export interface LogoutOptions {
      readonly discardUnsynced?: boolean;
  }
  export interface SessionApi {
      readonly user: SessionUser;
      readonly via: AuthVia;
      isAdmin(): boolean;
      fetch(path: string, init?: RequestInit): Promise<Response>;
      fetchPlugin(path: string, init?: RequestInit): Promise<Response>;
      onAuthRequired(listener: () => void): Unsubscribe;
      logout(options?: LogoutOptions): Promise<void>;
  }

  // ---- settings.ts ---------------------------------------------
  export const SETTINGS_DOC_PATH = ".settings";
  export type SettingsValue = string | number | boolean | null | readonly CoreValue[];
  export interface SettingsFieldSchema {
      readonly type: "string" | "number" | "boolean" | "enum" | "list";
      readonly label?: string;
      readonly description?: string;
      readonly default?: SettingsValue;
      readonly options?: readonly string[];
  }
  export type SettingsSchema = Readonly<Record<string, SettingsFieldSchema>>;
  export interface SettingsApi {
      defineSchema(schema: SettingsSchema): void;
      schema(): SettingsSchema;
      get<T extends SettingsValue>(key: string): T | undefined;
      all(): Readonly<Record<string, SettingsValue>>;
      set(key: string, value: SettingsValue): Promise<void>;
      remove(key: string): Promise<void>;
      subscribe(listener: (values: Readonly<Record<string, SettingsValue>>) => void): Unsubscribe;
      readonly documentId: string | undefined;
  }

  // ---- shape.ts ------------------------------------------------
  export interface ShapeIssue {
      readonly path: string;
      readonly expected: string;
      readonly got: string;
  }
  export type ShapeJson = "string" | "number" | "boolean" | "func" | "promise" | "component" | "any" | {
      readonly literal: readonly (string | number | boolean)[];
  } | {
      readonly union: readonly ShapeJson[];
  } | {
      readonly array: ShapeJson;
  } | {
      readonly record: ShapeJson;
  } | {
      readonly object: Readonly<Record<string, ShapeJson>>;
  } | {
      readonly optional: ShapeJson;
  };
  export interface Shape<T> {
      readonly name: string;
      check(value: unknown, path?: string): readonly ShapeIssue[];
      toJSON?(): ShapeJson;
      readonly ts?: string;
      readonly doc?: string;
  }
  export interface BuiltShape<T> extends Shape<T> {
      toJSON(): ShapeJson;
      readonly parts?: {
          readonly fields?: Readonly<Record<string, BuiltShape<unknown>>>;
          readonly item?: BuiltShape<unknown>;
          readonly members?: readonly BuiltShape<unknown>[];
          readonly args?: readonly BuiltShape<unknown>[];
          readonly returns?: BuiltShape<unknown>;
      };
      as(ts: string): BuiltShape<T>;
      describe(doc: string): BuiltShape<T>;
  }
  export const anyValue: <T = unknown>() => BuiltShape<T>;
  export const string: () => BuiltShape<string>;
  export const number: () => BuiltShape<number>;
  export const boolean: () => BuiltShape<boolean>;
  export const func: <F extends (...args: never[]) => unknown>(args?: readonly Shape<unknown>[], returns?: Shape<unknown>) => BuiltShape<F>;
  export const promise: <T = unknown>(inner?: Shape<T>) => BuiltShape<Promise<T>>;
  export const component: <P = unknown>() => BuiltShape<(props: P) => unknown>;
  export const literal: <const V extends string | number | boolean>(...allowed: readonly V[]) => BuiltShape<V>;
  export const array: <T>(item: Shape<T>) => BuiltShape<readonly T[]>;
  export const optional: <T>(inner: Shape<T>) => BuiltShape<T | undefined>;
  export const union: <T>(...members: readonly Shape<unknown>[]) => BuiltShape<T>;
  export const record: <T>(value: Shape<T>) => BuiltShape<Readonly<Record<string, T>>>;
  type FieldsOf<F extends Record<string, Shape<unknown>>> = {
      -readonly [K in keyof F]: F[K] extends Shape<infer T> ? T : never;
  };
  export const object: <F extends Record<string, Shape<unknown>>>(fields: F) => BuiltShape<FieldsOf<F>>;
  export const s: {
      readonly any: <T = unknown>() => BuiltShape<T>;
      readonly string: () => BuiltShape<string>;
      readonly number: () => BuiltShape<number>;
      readonly boolean: () => BuiltShape<boolean>;
      readonly func: <F extends (...args: never[]) => unknown>(args?: readonly Shape<unknown>[], returns?: Shape<unknown>) => BuiltShape<F>;
      readonly fn: <F extends (...args: never[]) => unknown>(args?: readonly Shape<unknown>[], returns?: Shape<unknown>) => BuiltShape<F>;
      readonly promise: <T = unknown>(inner?: Shape<T>) => BuiltShape<Promise<T>>;
      readonly component: <P = unknown>() => BuiltShape<(props: P) => unknown>;
      readonly literal: <const V extends string | number | boolean>(...allowed: readonly V[]) => BuiltShape<V>;
      readonly array: <T>(item: Shape<T>) => BuiltShape<readonly T[]>;
      readonly optional: <T>(inner: Shape<T>) => BuiltShape<T | undefined>;
      readonly union: <T>(...members: readonly Shape<unknown>[]) => BuiltShape<T>;
      readonly record: <T>(value: Shape<T>) => BuiltShape<Readonly<Record<string, T>>>;
      readonly object: <F extends Record<string, Shape<unknown>>>(fields: F) => BuiltShape<FieldsOf<F>>;
  };
  export function shapeFromJSON(json: ShapeJson): BuiltShape<unknown>;
  export function validate<T>(shape: Shape<T>, value: unknown): readonly ShapeIssue[];
  export function formatIssues(issues: readonly ShapeIssue[]): string;
  export {};

  // ---- slots.ts ------------------------------------------------
  export interface SlotEntries extends GeneratedSlotEntries {
  }
  export interface SignalPayloads extends GeneratedSignalPayloads {
  }
  export interface SignalResponses extends GeneratedSignalResponses {
  }
  export type SignalPayloadOf<S extends string> = S extends keyof SignalPayloads ? SignalPayloads[S] : unknown;
  export type SignalResponseOf<S extends string> = S extends keyof SignalResponses ? SignalResponses[S] : unknown;
  export type SignalScope = "session" | "user" | "workspace";
  export interface EmitOptions {
      readonly to?: SignalScope;
  }
  export interface RequestOptions {
      readonly timeoutMs?: number;
  }
  export interface SignalMeta {
      readonly name: string;
      readonly from: string;
      readonly scope: SignalScope;
  }
  export interface SlotEntry {
      readonly id: string;
      readonly [field: string]: unknown;
  }
  export type SlotEntryOf<S extends string> = S extends keyof SlotEntries ? SlotEntries[S] : SlotEntry;
  export interface SlotList<E = SlotEntry> {
      get(): readonly E[];
      subscribe(listener: (entries: readonly E[]) => void): Unsubscribe;
  }
  export interface ActionNode {
      readonly id: string;
      readonly title: string;
      readonly plugin: string;
      readonly placements: readonly {
          readonly slot: string;
          readonly plugin: string;
      }[];
      readonly keybindings: readonly string[];
  }
  export interface ContractsApi {
      fillers(): Readonly<Record<string, readonly string[]>>;
      actions(): readonly ActionNode[];
      decorations(): readonly DecorationInfo[];
      decorationFailures(): readonly DecorationFailure[];
  }
  export type ContractKind = "slot" | "signal" | "component";
  export interface ContractNode {
      readonly name: string;
      readonly kind: ContractKind;
      readonly owner: string;
      readonly fills: readonly string[];
      readonly decorates: readonly string[];
      readonly emits: readonly string[];
      readonly handles: readonly string[];
      readonly listens: readonly string[];
      readonly uses: readonly string[];
  }
  export interface ContractGraph {
      readonly contracts: readonly ContractNode[];
      readonly unprovided: readonly {
          readonly plugin: string;
          readonly name: string;
      }[];
  }
  export const KERNEL_OWNER = "kernel";
  export interface SlotReader {
      list(name: string): SlotList<unknown>;
      fill(pluginId: string, slot: string, entry: unknown): Unsubscribe;
      fillerOf(entry: unknown): string | undefined;
  }
  export function installSlotReader(reader: SlotReader): void;
  export function fillerOf(entry: unknown): string | undefined;
  export function fillForActivating(slot: string, entry: unknown): Unsubscribe;
  export function useSlot<S extends string>(name: S): readonly SlotEntryOf<S>[];
  export function useSignal<S extends string>(kernel: Pick<Kernel, "on">, name: S, listener: (payload: SignalPayloadOf<S>, meta: SignalMeta) => void): void;
  type SignalDecl = {
      readonly response?: unknown;
  };
  export function contractGraph(manifests: readonly {
      readonly id: string;
      readonly slots?: Readonly<Record<string, unknown>>;
      readonly signals?: Readonly<Record<string, SignalDecl>>;
      readonly components?: Readonly<Record<string, unknown>>;
      readonly uses?: readonly string[];
      readonly backend?: {
          readonly signals?: readonly string[];
      };
  }[], kernel: {
      readonly slots: readonly string[];
      readonly signals: Readonly<Record<string, SignalDecl>>;
  }, fills: Readonly<Record<string, readonly string[]>>, decorations?: readonly {
      readonly pluginId: string;
      readonly query: string;
      readonly target: string;
  }[]): ContractGraph;
  export {};

  // ---- sync.ts -------------------------------------------------
  export type SyncStatus = "offline" | "connecting" | "syncing" | "synced" | "auth-required" | "error";
  export interface BootstrapProgress {
      readonly rows: number;
      readonly total?: number;
      readonly complete: boolean;
  }
  export interface SyncState {
      readonly status: SyncStatus;
      readonly safeSeq: number;
      readonly headSeq: number;
      readonly pending: number;
      readonly bootstrap?: BootstrapProgress;
      readonly lastError?: string;
  }
  export interface SyncApi {
      readonly state: SyncState;
      subscribe(listener: (state: SyncState) => void): Unsubscribe;
      reconnectNow(): void;
  }

  // ---- types.ts ------------------------------------------------
  export type Unsubscribe = () => void;
  export interface Disposable {
      dispose(): void;
  }
  export type Iso8601 = string;
  export type CoreValue = null | boolean | number | string | readonly CoreValue[] | {
      readonly [key: string]: CoreValue;
  };
  export type CoreMap = {
      readonly [key: string]: CoreValue;
  };
  export type FmValue = CoreValue;
  export interface KernelLogger {
      debug(message: string, ...detail: readonly unknown[]): void;
      info(message: string, ...detail: readonly unknown[]): void;
      warn(message: string, ...detail: readonly unknown[]): void;
      error(message: string, ...detail: readonly unknown[]): void;
  }

  // ---- ui.ts ---------------------------------------------------
  export type ThemeTokenName = "--ddd-bg" | "--ddd-bg-subtle" | "--ddd-bg-raised" | "--ddd-bg-overlay" | "--ddd-border" | "--ddd-border-strong" | "--ddd-text" | "--ddd-text-muted" | "--ddd-text-inverse" | "--ddd-link" | "--ddd-accent" | "--ddd-accent-text" | "--ddd-accent-subtle" | "--ddd-danger" | "--ddd-danger-text" | "--ddd-warning" | "--ddd-success" | "--ddd-focus-ring" | "--ddd-selection" | "--ddd-shadow-1" | "--ddd-shadow-2" | "--ddd-font-sans" | "--ddd-font-mono" | "--ddd-radius" | "--ddd-radius-lg" | "--ddd-space" | "--ddd-tap-target";
  export type ThemeTokens = Readonly<Record<ThemeTokenName, string>>;
  export type ColorScheme = "light" | "dark";
  export type ColorSchemePreference = ColorScheme | "system";
  export const DEFAULT_LIGHT_TOKENS: ThemeTokens;
  export const DEFAULT_DARK_TOKENS: ThemeTokens;
  export const THEME_TOKEN_NAMES: readonly ThemeTokenName[];
  export interface ThemeTokensApi {
      readonly names: readonly ThemeTokenName[];
      defaults(scheme: ColorScheme): ThemeTokens;
      current(): ThemeTokens;
      apply(scheme: ColorScheme, tokens: Partial<ThemeTokens>): Unsubscribe;
      reset(): void;
  }
  export type NoticeLevel = "info" | "warning" | "error";
  export interface NoticeAction {
      readonly label: string;
      run(): void;
  }
  export interface NoticeProgress {
      readonly value: number;
      readonly label?: string;
  }
  export interface Notice {
      readonly id: string;
      readonly level: NoticeLevel;
      readonly message: string;
      readonly detail?: string;
      readonly actions?: readonly NoticeAction[];
      readonly progress?: NoticeProgress;
      readonly pluginId?: string;
  }
  export interface BoundaryInfo {
      readonly point: string;
      readonly pluginId?: string;
      readonly fallback?: ComponentType<{
          readonly error: Error;
          readonly pluginId: string;
      }>;
  }
  export interface UiApi {
      readonly root: HTMLElement;
      mount(element: ReactNode): Unsubscribe;
      boundary<P extends object>(component: ComponentType<P>, info: BoundaryInfo): ComponentType<P>;
      notify(notice: Notice): Unsubscribe;
      notices(): readonly Notice[];
      onNotices(listener: (notices: readonly Notice[]) => void): Unsubscribe;
      readonly tokens: ThemeTokensApi;
      readonly colorScheme: ColorScheme;
      colorSchemePreference(): ColorSchemePreference;
      setColorSchemePreference(preference: ColorSchemePreference): void;
      onColorScheme(listener: (scheme: ColorScheme) => void): Unsubscribe;
  }
}
