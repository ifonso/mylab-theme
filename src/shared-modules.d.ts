/**
 * Minimal type declarations for JupyterLab's shared CodeMirror modules.
 *
 * `@codemirror/view`, `@codemirror/language` and `@jupyterlab/codemirror`
 * are singletons that JupyterLab provides at runtime: the builder consumes
 * them from the host (`import: false`), so nothing is bundled. They are not
 * installed in this repo, so only the members src/syntax.ts uses are typed
 * here. Adding the packages as dependencies would make this file redundant.
 */

declare module '@codemirror/view' {
  import type {
    EditorState,
    Extension,
    Range,
    RangeSet,
    RangeValue
  } from '@codemirror/state';

  export abstract class Decoration extends RangeValue {
    static mark(spec: { class?: string }): Decoration;
    static set(
      of: Range<Decoration> | readonly Range<Decoration>[],
      sort?: boolean
    ): DecorationSet;
    static none: DecorationSet;
  }

  export type DecorationSet = RangeSet<Decoration>;

  export interface EditorView {
    readonly state: EditorState;
    readonly visibleRanges: readonly { from: number; to: number }[];
  }

  export interface ViewUpdate {
    readonly view: EditorView;
    readonly state: EditorState;
    readonly startState: EditorState;
    readonly docChanged: boolean;
    readonly viewportChanged: boolean;
  }

  export interface PluginValue {
    update?(update: ViewUpdate): void;
    destroy?(): void;
  }

  export class ViewPlugin<V extends PluginValue> {
    static fromClass<V extends PluginValue>(
      cls: new (view: EditorView) => V,
      spec?: { decorations?: (value: V) => DecorationSet }
    ): ViewPlugin<V>;
    readonly extension: Extension;
  }
}

declare module '@codemirror/language' {
  import type { EditorState, Facet } from '@codemirror/state';

  export interface NodeType {
    readonly name: string;
  }

  export interface SyntaxNode {
    readonly name: string;
    readonly from: number;
    readonly to: number;
    readonly parent: SyntaxNode | null;
    readonly firstChild: SyntaxNode | null;
  }

  export interface Tree {
    iterate(spec: {
      from?: number;
      to?: number;
      enter(node: {
        readonly name: string;
        from: number;
        to: number;
      }): boolean | void;
    }): void;
    resolveInner(pos: number, side?: -1 | 0 | 1): SyntaxNode;
  }

  export interface Language {
    readonly name: string;
  }

  export const language: Facet<Language, Language | null>;
  export function syntaxTree(state: EditorState): Tree;
}

declare module '@jupyterlab/codemirror' {
  import type { Extension } from '@codemirror/state';
  import type { Token } from '@lumino/coreutils';

  export interface IConfigurableExtension<T> {
    instance(value: T): Extension;
    reconfigure(value: T): unknown;
  }

  export interface IEditorExtensionFactory<T> {
    readonly name: string;
    readonly factory: (options: unknown) => IConfigurableExtension<T> | null;
  }

  export interface IEditorExtensionRegistry {
    addExtension<T>(factory: IEditorExtensionFactory<T>): void;
  }

  export const IEditorExtensionRegistry: Token<IEditorExtensionRegistry>;
}
