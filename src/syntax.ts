import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate
} from '@codemirror/view';
import { language, SyntaxNode, syntaxTree, Tree } from '@codemirror/language';
import type { EditorState } from '@codemirror/state';

/**
 * IPython magics, which the stock highlight style cannot express. JupyterLab
 * maps lezer tags to `--jp-mirror-editor-*` variables, and the Python grammar
 * has no magics: a `%` at a line start becomes an error node or, after error
 * recovery, a modulo operator (sharing the arithmeticOperator tag with `@`,
 * `*`, `+`). This mark adds a stable class, `cm-clean-magic`, on `%name` and
 * `%%name`, which style/codemirror.css colours.
 */
const magicMark = Decoration.mark({ class: 'cm-clean-magic' });

/**
 * A magic where IPython accepts one: at the start of a line, or as the value
 * of a plain assignment (`t = %timeit -o f()`). Group 1 is the prefix,
 * group 2 the magic itself.
 */
const MAGIC =
  /^([ \t]*(?:[A-Za-z_][\w.]*(?:[ \t]*,[ \t]*[A-Za-z_][\w.]*)*[ \t]*=[ \t]*)?)(%%?[A-Za-z_]\w*)/;

/** Nodes whose text is literal, never code. */
const LITERALS = new Set(['String', 'FormatString', 'Comment']);

/** Opening brackets: a line inside them continues an expression. */
const OPENERS = new Set(['(', '[', '{']);

/**
 * The Python grammar has no magics, so a `%` at a line start parses as an
 * error node or, after error recovery, as modulo. Tell a real magic from
 * modulo the way IPython does: a `%` that continues an expression (inside
 * brackets opened on an earlier line, or after a backslash) is modulo.
 */
function isMagic(state: EditorState, tree: Tree, pos: number): boolean {
  const line = state.doc.lineAt(pos);
  if (
    line.number > 1 &&
    /\\[ \t]*$/.test(state.doc.line(line.number - 1).text)
  ) {
    return false;
  }
  for (
    let node: SyntaxNode | null = tree.resolveInner(pos, 1);
    node;
    node = node.parent
  ) {
    if (LITERALS.has(node.name)) {
      return false;
    }
    const open = node.firstChild;
    if (open && OPENERS.has(open.name) && open.from < line.from) {
      return false;
    }
  }
  return true;
}

function buildDecorations(view: EditorView): DecorationSet {
  const { state } = view;
  if (state.facet(language)?.name !== 'python') {
    return Decoration.none;
  }
  const tree = syntaxTree(state);
  const marks = [];
  for (const { from, to } of view.visibleRanges) {
    for (let pos = from; pos <= to;) {
      const line = state.doc.lineAt(pos);
      const match = MAGIC.exec(line.text);
      if (match) {
        const start = line.from + match[1].length;
        if (isMagic(state, tree, start)) {
          marks.push(magicMark.range(start, start + match[2].length));
        }
      }
      pos = line.to + 1;
    }
  }
  return Decoration.set(marks, true);
}

/**
 * CodeMirror extension that keeps the marks in sync with the visible text
 * and the (incrementally parsed) syntax tree.
 */
export const syntaxAccents = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }

    update(update: ViewUpdate): void {
      if (
        update.docChanged ||
        update.viewportChanged ||
        syntaxTree(update.startState) !== syntaxTree(update.state) ||
        update.startState.facet(language) !== update.state.facet(language)
      ) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  { decorations: value => value.decorations }
);
