#!/usr/bin/env node
/**
 * fetch-design.mjs — download + unpack a Claude Code Design bundle.
 *
 * A bundle URL (https://api.anthropic.com/v1/design/h/<hash>) returns a gzipped
 * tar of the whole design project (the ?open_file= query is only a UI hint). This
 * script downloads it (or reads a local .tar.gz), extracts it, locates the design
 * artifacts, and prints a JSON manifest of absolute paths.
 *
 * Usage:
 *   node fetch-design.mjs <url|file.tar.gz> <outDir>
 *   → prints { root, css, theme, fonts, logos, symbols, favicon, brandDocs } as JSON
 */
import { mkdirSync, readdirSync, statSync, existsSync, copyFileSync, readFileSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import { execFileSync } from 'node:child_process';

const [src, outDir] = process.argv.slice(2);
if (!src || !outDir) {
  console.error('Usage: node fetch-design.mjs <url|file.tar.gz> <outDir>');
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
const archive = join(outDir, 'bundle.tar.gz');
const extractDir = join(outDir, 'extracted');
mkdirSync(extractDir, { recursive: true });

// 1) obtain the archive
if (/^https?:\/\//.test(src)) {
  execFileSync('curl', ['-sSL', src, '-o', archive], { stdio: 'inherit' });
} else {
  if (!existsSync(src)) { console.error(`✖ file not found: ${src}`); process.exit(1); }
  copyFileSync(src, archive);
}

// 2) validate it's a gzip archive (design bundle URLs are short-lived — an expired
//    one returns a tiny text/404 body, not gzip).
const head = readFileSync(archive).subarray(0, 2);
if (!(head[0] === 0x1f && head[1] === 0x8b)) {
  const preview = readFileSync(archive, 'utf8').slice(0, 200);
  console.error(`✖ Not a gzip bundle (${statSync(archive).size} bytes). The Claude Design URL may have expired — re-export from Claude Design and retry promptly.\n  Response: ${preview}`);
  process.exit(2);
}

// 3) extract (gzipped tar)
execFileSync('tar', ['xzf', archive, '-C', extractDir]);

// 3) walk + classify
function walk(dir) {
  let out = [];
  for (const e of readdirSync(dir)) {
    const f = join(dir, e);
    const st = statSync(f);
    if (st.isDirectory()) out = out.concat(walk(f));
    else out.push(f);
  }
  return out;
}
const files = walk(extractDir);
const lc = (p) => p.toLowerCase();

const cssAll = files.filter((f) => extname(f) === '.css');
const manifest = {
  root: extractDir,
  // design-system CSS: prefer tokens.css / *colors* / theme.css
  css: cssAll.filter((f) => /tokens|colors|theme|globals/i.test(basename(f))),
  allCss: cssAll,
  fonts: files.filter((f) => /\.(ttf|otf|woff2?)$/i.test(f)),
  logos: files.filter((f) => /\.svg$/i.test(f) && /logo/i.test(lc(f))),
  symbols: files.filter((f) => /\.svg$/i.test(f) && /symbol/i.test(lc(f))),
  favicon: files.filter((f) => /favicon/i.test(lc(f)) && /\.svg$/i.test(f)),
  brandDocs: files.filter((f) => extname(f) === '.md' && /(brand|design|guide|brief|readme)/i.test(lc(f))),
};

console.log(JSON.stringify(manifest, null, 2));
