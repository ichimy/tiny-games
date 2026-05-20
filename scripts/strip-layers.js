// Generates *.compat.css files with @layer syntax removed.
// Run once after adding/editing CSS: node scripts/strip-layers.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const files = [
  'styles.css',
  'games/balloon-pop/balloon-pop.css',
  'games/do-anything/do-anything.css',
  'games/paint-splat/paint-splat.css',
  'games/rainbow-sort/rainbow-sort.css',
  'games/music-maker/music-maker.css',
  'games/star-catcher/star-catcher.css',
];

function stripLayers(css) {
  // Remove @layer ordering declarations: @layer a, b, c;
  css = css.replace(/@layer\s+[\w\s,]+;/g, '');

  // Unwrap @layer name { ... } blocks using brace counting.
  // Skips /* ... */ comments so braces inside them are ignored.
  let result = '';
  let i = 0;

  while (i < css.length) {
    // Skip block comments to avoid counting braces inside them.
    if (css[i] === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      if (end === -1) { result += css.slice(i); break; }
      result += css.slice(i, end + 2);
      i = end + 2;
      continue;
    }

    // Detect @layer name { (block form, not statement).
    const layerMatch = css.slice(i).match(/^@layer\s+\w+\s*\{/);
    if (layerMatch) {
      i += layerMatch[0].length; // skip the @layer name { opener
      let depth = 1;
      while (i < css.length && depth > 0) {
        if (css[i] === '/' && css[i + 1] === '*') {
          // Comment inside layer — copy verbatim, don't count braces.
          const end = css.indexOf('*/', i + 2);
          if (end === -1) { result += css.slice(i); i = css.length; break; }
          result += css.slice(i, end + 2);
          i = end + 2;
          continue;
        }
        if (css[i] === '{') depth++;
        else if (css[i] === '}') {
          depth--;
          if (depth === 0) { i++; break; } // skip the closing }
        }
        result += css[i];
        i++;
      }
      continue;
    }

    result += css[i];
    i++;
  }

  // Collapse runs of 3+ blank lines into 2 blank lines.
  return result.replace(/\n{4,}/g, '\n\n\n');
}

for (const file of files) {
  const src = path.join(root, file);
  if (!fs.existsSync(src)) { console.warn(`⚠ Skipped (not found): ${file}`); continue; }
  const css = fs.readFileSync(src, 'utf8');
  const out = src.replace(/\.css$/, '.compat.css');
  fs.writeFileSync(out, stripLayers(css));
  console.log(`✓ ${file.replace(/\.css$/, '.compat.css')}`);
}
