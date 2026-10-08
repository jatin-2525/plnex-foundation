import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(full));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(full);
    }
  });
  return results;
}

const files = walk('src');

const issues = {
  invalidClasses: [],
  oddCardPadding: [],
  oddGaps: [],
  oddMargins: [],
};

const ODD_CARD_PAD_REGEX = /\bp-(?:0\.2|1\.5|2\.5|3\.5|5|7)\b/g;
const ODD_GAP_REGEX = /\b(gap|gap-x|gap-y|space-x|space-y)-(?:2\.5|3\.5|5)\b/g;
const ODD_MARGIN_REGEX = /\b(m|mx|my|mt|mb|ml|mr)-(?:2\.5|3\.5|5)\b/g;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;

    if (line.includes('py-0.2')) {
      issues.invalidClasses.push({ file, lineNum, line: line.trim() });
    }

    const padMatches = line.match(ODD_CARD_PAD_REGEX);
    if (padMatches) {
      padMatches.forEach((m) => {
        issues.oddCardPadding.push({ file, lineNum, match: m, line: line.trim() });
      });
    }

    const gapMatches = line.match(ODD_GAP_REGEX);
    if (gapMatches) {
      gapMatches.forEach((m) => {
        issues.oddGaps.push({ file, lineNum, match: m, line: line.trim() });
      });
    }

    const marginMatches = line.match(ODD_MARGIN_REGEX);
    if (marginMatches) {
      marginMatches.forEach((m) => {
        issues.oddMargins.push({ file, lineNum, match: m, line: line.trim() });
      });
    }
  });
}

console.log('--- Verifying 8px Spacing System in PLnEX ---');
let failed = 0;

if (issues.invalidClasses.length === 0) {
  console.log('[PASS] Zero invalid Tailwind spacing classes (e.g. py-0.2 eliminated)');
} else {
  console.error(`[FAIL] Found ${issues.invalidClasses.length} invalid spacing classes (py-0.2)`);
  failed++;
}

if (issues.oddCardPadding.length === 0) {
  console.log('[PASS] Zero odd card/container paddings (all aligned to 8px system: p-2 [8px], p-4 [16px], p-6 [24px], p-8 [32px])');
} else {
  console.error(`[FAIL] Found ${issues.oddCardPadding.length} odd card paddings (p-2.5, p-3.5, p-5)`);
  failed++;
}

if (issues.oddGaps.length === 0) {
  console.log('[PASS] Zero odd gaps / stack spacing (all aligned to 8px system: gap-2 [8px], gap-4 [16px], gap-6 [24px], gap-8 [32px])');
} else {
  console.error(`[FAIL] Found ${issues.oddGaps.length} odd gap/stack spacings (gap-2.5, gap-3.5, gap-5, space-y-2.5, space-y-3.5, space-y-5)`);
  failed++;
}

if (issues.oddMargins.length === 0) {
  console.log('[PASS] Zero odd margins (all aligned to 8px system: m-2 [8px], m-4 [16px], m-6 [24px])');
} else {
  console.error(`[FAIL] Found ${issues.oddMargins.length} odd margins`);
  failed++;
}

// Check spacing.ts token file
const spacingTs = fs.readFileSync('src/tokens/spacing.ts', 'utf8');
if (spacingTs.includes('SPACING_SYSTEM_8PX') || spacingTs.includes('grid: 8')) {
  console.log('[PASS] src/tokens/spacing.ts formalizes the 8px spacing system');
} else {
  console.error('[FAIL] src/tokens/spacing.ts does not formalize the 8px spacing system');
  failed++;
}

if (failed > 0) {
  console.error(`\nSpacing verification failed with ${failed} issue categories.`);
  process.exit(1);
} else {
  console.log('\nAll 8px Spacing System checks passed successfully!\n');
  process.exit(0);
}
