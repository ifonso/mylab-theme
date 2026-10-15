import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { IThemeManager } from '@jupyterlab/apputils';

import { IEditorExtensionRegistry } from '@jupyterlab/codemirror';

import { LabIcon } from '@jupyterlab/ui-components';

import { syntaxAccents } from './syntax';

/**
 * Original SVGs of the icons this theme replaces, so switching to another
 * theme puts JupyterLab's own icons back.
 */
const originalIcons = new Map<string, string>();

/**
 * Attributes copied from a source SVG root when patching an icon in place.
 * The data-* tags mark replacement icons with their LabIcon name.
 */
const COPIED_ATTRIBUTES = [
  'viewBox',
  'width',
  'height',
  'data-clean-icon',
  'data-phosphor'
];

/**
 * Parse an icon's svgstr the same way LabIcon does, so markup compares and
 * copies exactly as JupyterLab renders it.
 */
function parseIcon(name: string, svgstr: string): HTMLElement | null {
  return LabIcon.resolveSvg({ name, svgstr });
}

/**
 * Serialize markup the way the live document does. LabIcon parses SVGs as
 * XML ("<path/>"), but once set through innerHTML the HTML parser
 * re-serializes them ("<path></path>"), so compare in this form.
 */
function normalizeMarkup(markup: string): string {
  const scratch = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  scratch.innerHTML = markup;
  return scratch.innerHTML;
}

/**
 * Rewrite an on-screen SVG in place with another icon's markup. Mutating the
 * node, instead of replacing it, keeps React's references valid.
 */
function copyInto(target: SVGSVGElement, source: HTMLElement): void {
  target.innerHTML = source.innerHTML;
  for (const attr of COPIED_ATTRIBUTES) {
    const value = source.getAttribute(attr);
    if (value === null) {
      target.removeAttribute(attr);
    } else {
      target.setAttribute(attr, value);
    }
  }
}

/**
 * Swap JupyterLab's icons for the theme's set. Setting `svgstr` on a LabIcon
 * re-renders the copies already on screen. Views made with
 * `LabIcon.bindprops()` before the swap keep their own render cache, so
 * after a frame any SVG still showing a stock icon is patched in place.
 * The icon module is loaded lazily, only when the theme is applied.
 */
async function applyIcons(): Promise<void> {
  const { ICON_OVERRIDES } = await import('./icons');
  const stockMarkup = new Map<string, string>();
  for (const [name, svgstr] of Object.entries(ICON_OVERRIDES)) {
    const icon = LabIcon.resolve({ icon: name });
    if (!originalIcons.has(name)) {
      originalIcons.set(name, icon.svgstr);
    }
    const stock = parseIcon(name, originalIcons.get(name)!);
    if (stock) {
      stockMarkup.set(normalizeMarkup(stock.innerHTML), name);
    }
    icon.svgstr = svgstr;
  }

  requestAnimationFrame(() => {
    document
      .querySelectorAll<SVGSVGElement>('svg:not([data-clean-icon])')
      .forEach(svg => {
        const name = stockMarkup.get(svg.innerHTML);
        const replacement = name && parseIcon(name, ICON_OVERRIDES[name]);
        if (replacement) {
          copyInto(svg, replacement);
        }
      });
  });
}

/**
 * Put back the icons that applyIcons() replaced. Replacement SVGs carry their
 * LabIcon name, so any still on screen after a frame are patched back.
 */
function restoreIcons(): void {
  for (const [name, svgstr] of originalIcons) {
    LabIcon.resolve({ icon: name }).svgstr = svgstr;
  }
  const originals = new Map(originalIcons);
  originalIcons.clear();

  requestAnimationFrame(() => {
    document
      .querySelectorAll<SVGSVGElement>('svg[data-clean-icon]')
      .forEach(svg => {
        const name = svg.dataset.cleanIcon;
        const svgstr = name && originals.get(name);
        const original = svgstr && parseIcon(name, svgstr);
        if (original) {
          copyInto(svg, original);
        }
      });
  });
}

/**
 * Initialization data for the mylab-theme extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'mylab-theme:plugin',
  description: 'A JupyterLab minimalist theme based on RStudio and Datalore.',
  autoStart: true,
  requires: [IThemeManager],
  optional: [IEditorExtensionRegistry],
  activate: (
    app: JupyterFrontEnd,
    manager: IThemeManager,
    editorExtensions: IEditorExtensionRegistry | null
  ) => {
    const style = 'mylab-theme/index.css';

    // Both variants load the same stylesheet. JupyterLab writes the active
    // theme's name to <body data-jp-theme-name>, and style/gruvbox.css swaps
    // the colour tokens when it is the dark variant. Layout, fonts and icons
    // are shared.
    const variants = [
      { name: 'mylab-light', displayName: 'Mylab Light', isLight: true },
      {
        name: 'mylab-gruvbox-dark',
        displayName: 'Mylab Gruvbox Dark',
        isLight: false
      }
    ];
    for (const { name, displayName, isLight } of variants) {
      manager.register({
        name,
        displayName,
        isLight,
        themeScrollbars: true,
        load: async () => {
          await applyIcons();
          await manager.loadCSS(style);
        },
        unload: () => {
          restoreIcons();
          return Promise.resolve(undefined);
        }
      });
    }

    // Class for IPython magics (see syntax.ts). Harmless under other
    // themes: only this theme's CSS colours them.
    editorExtensions?.addExtension({
      name: 'mylab-theme:syntax-accents',
      factory: () => ({
        instance: () => syntaxAccents,
        reconfigure: () => null
      })
    });
  }
};

export default plugin;
