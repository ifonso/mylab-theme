/**
 * Generates src/icons.ts: JupyterLab icon name -> replacement SVG string.
 *
 * Source set: Phosphor Icons, Regular weight (@phosphor-icons/core, MIT).
 * Each Phosphor SVG is a single <path> on a 256x256 grid with
 * fill="currentColor". JupyterLab colours icons through classes on the
 * shapes, so the converter moves colour onto the path as fill="#616161"
 * with class="jp-icon3 jp-icon-selectable", the same contract the stock
 * icons use. That keeps every existing theme rule working: the grey
 * default, hover darkening, the accent on the active sidebar tab, and the
 * inverted colour on selected rows.
 *
 * Usage: node scripts/build-icons.mjs   (or: jlpm build:icons)
 * Edit ICON_MAP below, then rerun and rebuild.
 */
/* global console */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// The package's "exports" map hides its assets, so read them from disk.
const phosphorDir = join(
  root,
  'node_modules',
  '@phosphor-icons',
  'core',
  'assets',
  'regular'
);

/**
 * JupyterLab LabIcon name -> Phosphor Regular icon name.
 * Grouped by where the icon shows up. Icons left out on purpose: the Jupyter
 * logos, the kernel status circles (filled/empty carries meaning), kernel
 * logos (images, not LabIcons), debugger stepping and dock-position icons.
 */
const ICON_MAP = {
  // Sidebar rails
  'ui-components:folder': 'folder-simple',
  'ui-components:running': 'cpu',
  'ui-components:toc': 'list-bullets',
  'ui-components:extension': 'puzzle-piece',
  'ui-components:build': 'sliders-horizontal',
  'ui-components:bug': 'bug',
  'ui-components:bug-dot': 'bug-beetle',

  // Notebook toolbar and cell actions
  'ui-components:save': 'floppy-disk',
  'ui-components:add': 'plus',
  'ui-components:cut': 'scissors',
  'ui-components:copy': 'copy',
  'ui-components:paste': 'clipboard-text',
  'ui-components:run': 'play',
  'ui-components:stop': 'stop',
  'ui-components:refresh': 'arrow-clockwise',
  'ui-components:fast-forward': 'fast-forward',
  'ui-components:duplicate': 'copy-simple',
  'ui-components:move-up': 'arrow-up',
  'ui-components:move-down': 'arrow-down',
  'ui-components:add-above': 'rows-plus-top',
  'ui-components:add-below': 'rows-plus-bottom',
  'ui-components:delete': 'trash',
  'ui-components:undo': 'arrow-counter-clockwise',
  'ui-components:redo': 'arrows-clockwise',
  'ui-components:ellipses': 'dots-three',
  'ui-components:dots': 'dots-three-vertical',
  'ui-components:expand-all': 'arrows-out-line-vertical',
  'ui-components:collapse-all': 'arrows-in-line-vertical',

  // File browser
  'ui-components:new-folder': 'folder-simple-plus',
  'ui-components:file-upload': 'upload-simple',
  'ui-components:filter': 'funnel-simple',
  'ui-components:filter-list': 'funnel-simple',
  'ui-components:home': 'house-simple',
  'ui-components:folder-favorite': 'folder-star',
  'ui-components:download': 'download-simple',

  // File types and documents
  'ui-components:notebook': 'notebook',
  'ui-components:file': 'file',
  'ui-components:python': 'file-py',
  'ui-components:markdown': 'file-md',
  'ui-components:json': 'brackets-curly',
  'ui-components:yaml': 'file-code',
  'ui-components:html5': 'file-html',
  'ui-components:text-editor': 'file-text',
  'ui-components:terminal': 'terminal-window',
  'ui-components:console': 'terminal',
  'ui-components:image': 'image',
  'ui-components:spreadsheet': 'table',
  'ui-components:pdf': 'file-pdf',
  'ui-components:code': 'code',

  // Tabs, launcher, navigation
  'ui-components:close': 'x',
  'ui-components:launcher': 'squares-four',
  'ui-components:launch': 'arrow-square-out',
  'ui-components:search': 'magnifying-glass',
  'ui-components:caret-down': 'caret-down',
  'ui-components:caret-up': 'caret-up',
  'ui-components:caret-left': 'caret-left',
  'ui-components:caret-right': 'caret-right',
  'ui-components:caret-down-empty': 'caret-down',
  'ui-components:caret-down-empty-thin': 'caret-down',
  'ui-components:caret-up-empty-thin': 'caret-up',

  // Status bar, settings and misc
  'ui-components:kernel': 'cpu',
  'ui-components:bell': 'bell',
  'ui-components:trusted': 'shield-check',
  'ui-components:not-trusted': 'shield-slash',
  'ui-components:settings': 'gear-six',
  'ui-components:palette': 'palette',
  'ui-components:list': 'list',
  'ui-components:numbering': 'list-numbers',
  'ui-components:info': 'info',
  'ui-components:inspector': 'info',
  'ui-components:error': 'warning-circle',
  'ui-components:link': 'link',
  'ui-components:check': 'check',
  'ui-components:clear': 'broom',
  'ui-components:cleaning': 'broom',
  'ui-components:edit': 'pencil-simple',
  'ui-components:keyboard': 'keyboard',
  'ui-components:lock': 'lock-simple',
  'ui-components:user': 'user',
  'ui-components:users': 'users',
  'ui-components:history': 'clock-counter-clockwise',
  'ui-components:share': 'share-network',
  'ui-components:tag': 'tag',
  'ui-components:tree-view': 'tree-structure',
  'ui-components:table-rows': 'rows'
};

function convert(svg, phosphorName, labName) {
  const paths = [...svg.matchAll(/<path\s+d="([^"]+)"\s*\/>/g)].map(m => m[1]);
  if (paths.length === 0) {
    throw new Error(`No <path> found in Phosphor icon "${phosphorName}"`);
  }
  const body = paths
    .map(
      d => `<path class="jp-icon3 jp-icon-selectable" fill="#616161" d="${d}"/>`
    )
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" viewBox="0 0 256 256" data-clean-icon="${labName}" data-phosphor="${phosphorName}">${body}</svg>`;
}

const entries = Object.entries(ICON_MAP).map(([labName, phosphorName]) => {
  const file = join(phosphorDir, `${phosphorName}.svg`);
  const svg = convert(readFileSync(file, 'utf8'), phosphorName, labName);
  return `  ${JSON.stringify(labName)}:\n    ${JSON.stringify(svg)}`;
});

const out = `/*
 * GENERATED by scripts/build-icons.mjs. Do not edit by hand.
 *
 * Replacement SVGs for JupyterLab icons, from Phosphor Icons (Regular),
 * https://phosphoricons.com, MIT License, Copyright (c) 2023 Phosphor Icons.
 */

/**
 * JupyterLab LabIcon name -> replacement SVG string.
 */
export const ICON_OVERRIDES: Record<string, string> = {
${entries.join(',\n')}
};
`;

writeFileSync(join(root, 'src', 'icons.ts'), out);
console.log(`Wrote src/icons.ts with ${entries.length} icons.`);
