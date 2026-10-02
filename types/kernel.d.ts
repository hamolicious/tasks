/**
 * `@kernel` — the ddd plugin contract.
 *
 * Generated from web/kernel-api/src by web/scripts/build-kernel-dts.mjs.
 * Do not edit: edit the source and re-run `npm run kernel:dts`.
 *
 * Contract version: unknown
 * Served by the server at /kernel.d.ts (SPEC §6.4).
 */

declare module "@kernel" {
  import type * as Y from "yjs";
  import type { ComponentType, ReactNode } from "react";

  // ---- index.ts ------------------------------------------------
  export const KERNEL_API_VERSION: string;
  export const KERNEL_API_MAJOR: number;

  // ---- capabilities.ts -----------------------------------------
  export const SUPPORTED_BRIDGE_VERSION = 1;
  export type CapabilityName = "filesystem" | "notifications" | "folder";
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
  export interface CapabilitiesApi {
      has(name: CapabilityName): boolean;
      support(name: CapabilityName): CapabilitySupport;
      readonly bridgeVersion: number | undefined;
      readonly filesystem: FilesystemCapability;
      readonly notifications: NotificationsCapability;
      readonly folder: FolderCapability;
      storage(): Promise<StorageReport>;
  }
  export interface StorageReport {
      readonly persisted: boolean;
      readonly usageBytes?: number;
      readonly quotaBytes?: number;
  }

  // ---- documents.ts --------------------------------------------
  export type DocumentId = string;
  export type FilterJson = {
      readonly [key: string]: unknown;
  };
  export type SortDirection = "asc" | "desc";
  export interface SortKey {
      readonly field: string;
      readonly direction: SortDirection;
  }
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
      readonly purged: boolean;
  }
  export interface DocumentQuery {
      readonly filter?: FilterJson;
      readonly sort?: readonly SortKey[];
      readonly search?: string;
      readonly limit?: number;
      readonly offset?: number;
      readonly includeDeleted?: boolean;
  }
  export interface DocumentQueryResult {
      readonly rows: readonly DocumentRow[];
      readonly total: number;
  }
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
      readonly filter?: FilterJson;
  }
  export interface SearchHit {
      readonly id: DocumentId;
      readonly score: number;
      readonly terms: readonly string[];
  }
  export interface QueryPlan {
      readonly text?: string;
      readonly filter?: FilterJson;
      readonly sort?: readonly string[];
      readonly trash?: "live" | "trashed" | "all";
      readonly limit?: number;
      readonly offset?: number;
      readonly cursor?: string;
      readonly snippets?: boolean;
  }
  export interface PlanSnippet {
      readonly text: string;
      readonly ranges: readonly {
          readonly start: number;
          readonly end: number;
      }[];
      readonly line: number;
  }
  export interface PlanHit {
      readonly score: number;
      readonly terms: readonly string[];
      readonly snippet?: PlanSnippet;
  }
  export interface PlanResult {
      readonly rows: readonly DocumentRow[];
      readonly total: number;
      readonly nextCursor?: string;
      readonly hits: Readonly<Record<DocumentId, PlanHit>>;
  }
  export interface PlanSubscription {
      readonly result: PlanResult;
      onChange(listener: (result: PlanResult) => void): Unsubscribe;
      close(): void;
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
      query(query: DocumentQuery): Promise<DocumentQueryResult>;
      subscribe(query: DocumentQuery): Promise<QuerySubscription>;
      search(text: string, options?: SearchOptions): Promise<readonly SearchHit[]>;
      queryPlan(plan: QueryPlan): Promise<PlanResult>;
      subscribePlan(plan: QueryPlan): Promise<PlanSubscription>;
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

  // ---- kernel.ts -----------------------------------------------
  export interface CoreApi {
      parseDocument(text: string): ParsedText;
      resolveTitle(text: string): string;
      normalizeDate(input: string): string;
      semanticsVersion(): number;
  }
  export interface ParsedText {
      readonly title: string;
      readonly fm: CoreMap;
      readonly plugins: CoreMap;
      readonly fm_parse_error: boolean;
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
      readonly plugins: PluginsApi;
      readonly events: EventsApi;
      readonly settings: SettingsApi;
      readonly session: SessionApi;
      readonly sync: SyncApi;
      readonly ui: UiApi;
      readonly capabilities: CapabilitiesApi;
      readonly core: CoreApi;
      readonly log: KernelLogger;
  }
  export interface LoadedPlugin {
      readonly id: string;
      readonly version: string;
      readonly provides?: string;
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
  export const MANIFEST_KERNEL_VERSION = "3.1.0";
  export interface PluginFrontend {
      readonly module: string;
      readonly style?: string;
  }
  export interface PluginCapabilities {
      readonly documents?: readonly ("read" | "write")[];
      readonly http?: HttpCapability;
      readonly notifications?: boolean;
      readonly "public-routes"?: readonly (string)[];
  }
  export interface HttpCapability {
      readonly hosts: readonly (string)[];
  }
  export interface PluginConfigField {
      readonly type: "string" | "number" | "boolean" | "select";
      readonly secret?: boolean;
      readonly label?: string;
      readonly description?: string;
      readonly default?: unknown;
      readonly required?: boolean;
      readonly options?: readonly (string)[];
  }
  export interface PluginBackend {
      readonly module: string;
      readonly hooks?: readonly ("document.created" | "document.changed" | "document.deleted")[];
      readonly cron?: readonly (string)[];
      readonly routes?: readonly (string)[];
      readonly events?: readonly (string)[];
      readonly exports?: Readonly<Record<string, BackendExport>>;
  }
  export interface BackendExport {
      readonly input?: unknown;
      readonly output?: unknown;
      readonly description?: string;
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
  export function createRegistry<T>(options?: RegistryOptions<T>): Registry<T>;
  export function checked<F extends (...args: never[]) => unknown>(shape: Shape<unknown>, impl: F): F;

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
