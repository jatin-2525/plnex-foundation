import fs from 'fs';
import path from 'path';

console.log('--- Verifying Standardized Chart Colors & Palette Restraint in PLnEX ---');

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passed++;
  } else {
    console.error(`[FAIL] ${testName}`);
    failed++;
  }
}

// 1. Check tokens file existence and contents
const tokensPath = path.resolve('src/tokens/chartColors.ts');
assert(fs.existsSync(tokensPath), 'chartColors.ts tokens file exists');

const tokensContent = fs.readFileSync(tokensPath, 'utf8');

// Check canonical tokens
assert(tokensContent.includes("planned:"), 'Tokens define planned: neutral/primary');
assert(tokensContent.includes("#176B87"), 'Planned stroke is #176B87 (neutral/primary slate-teal)');
assert(tokensContent.includes("actual:"), 'Tokens define actual: primary/semantic contrast');
assert(tokensContent.includes("#2E7D5B"), 'Actual is #2E7D5B (high-contrast green)');
assert(tokensContent.includes("forecast:"), 'Tokens define forecast: dashed neutral/secondary');
assert(tokensContent.includes("#7B8798"), 'Forecast stroke is #7B8798 (dashed neutral slate)');
assert(tokensContent.includes("dashArray: '5,4'"), 'Forecast defines strokeDasharray "5,4"');
assert(tokensContent.includes("positive:"), 'Tokens define positive: green (#2E7D5B)');
assert(tokensContent.includes("warning:"), 'Tokens define warning: amber (#D98B32)');
assert(tokensContent.includes("critical:"), 'Tokens define critical: red (#B5473C)');
assert(tokensContent.includes("getChartStatusDescriptor"), 'Multi-channel helper getChartStatusDescriptor exported');

// 2. Check no SVG gradients across all chart components
const chartFiles = [
  'src/components/shared/SCurveChart.tsx',
  'src/components/shared/charts/BarChart.tsx',
  'src/components/shared/charts/HorizontalBarChart.tsx',
  'src/components/shared/charts/LineChart.tsx',
  'src/components/shared/charts/StatusDonutChart.tsx',
];

for (const relPath of chartFiles) {
  const fullPath = path.resolve(relPath);
  assert(fs.existsSync(fullPath), `${relPath} exists`);
  const content = fs.readFileSync(fullPath, 'utf8');

  assert(content.includes('CHART_TOKENS'), `${relPath} imports and utilizes CHART_TOKENS`);
  assert(!content.includes('<linearGradient'), `${relPath} does NOT contain <linearGradient>`);
  assert(!content.includes('<radialGradient'), `${relPath} does NOT contain <radialGradient>`);
  assert(!content.includes('gradient'), `${relPath} does NOT use gradients`);
}

// 3. Multi-channel validation (symbols, text descriptors, signs)
const scurveContent = fs.readFileSync(path.resolve('src/components/shared/SCurveChart.tsx'), 'utf8');
assert(scurveContent.includes('Planned (Neutral/Primary)'), 'SCurveChart legend includes Planned text descriptor');
assert(scurveContent.includes('Actual (Semantic Contrast)'), 'SCurveChart legend includes Actual text descriptor');
assert(scurveContent.includes('Forecast (Dashed Secondary)'), 'SCurveChart legend includes Forecast dashed descriptor');
assert(scurveContent.includes('CHART_TOKENS.forecast.dashArray'), 'SCurveChart renders forecast with dashed stroke token');

const lineContent = fs.readFileSync(path.resolve('src/components/shared/charts/LineChart.tsx'), 'utf8');
assert(lineContent.includes('CHART_TOKENS.forecast.dashArray'), 'LineChart forecast trajectory uses dashed stroke pattern');
assert(lineContent.includes('✓ Schedule Gain Ahead'), 'LineChart variance displays multi-channel ✓ Ahead glyph');
assert(lineContent.includes('✕ Schedule Slip Trend'), 'LineChart variance displays multi-channel ✕ Slip Trend glyph');

const barContent = fs.readFileSync(path.resolve('src/components/shared/charts/BarChart.tsx'), 'utf8');
assert(barContent.includes('Planned Target'), 'BarChart legend specifies Planned Target');
assert(barContent.includes('Actual (On-Track / Ahead)'), 'BarChart legend specifies Actual (On-Track / Ahead)');
assert(barContent.includes('[✓]'), 'BarChart variance pill pairs color with [✓] glyph');
assert(barContent.includes('[✕]'), 'BarChart variance pill pairs color with [✕] glyph');

const hbarContent = fs.readFileSync(path.resolve('src/components/shared/charts/HorizontalBarChart.tsx'), 'utf8');
assert(hbarContent.includes('[CRITICAL PATH ✕]'), 'HorizontalBarChart pairs critical path with ✕ symbol');
assert(hbarContent.includes('[✕ Critical Path]'), 'HorizontalBarChart value text pairs color with [✕ Critical Path] text');
assert(hbarContent.includes('Secondary Float Delay'), 'HorizontalBarChart identifies secondary float warning');

const donutContent = fs.readFileSync(path.resolve('src/components/shared/charts/StatusDonutChart.tsx'), 'utf8');
assert(donutContent.includes("glyph: '✓'"), 'StatusDonutChart verified slice has ✓ glyph');
assert(donutContent.includes("glyph: '●'"), 'StatusDonutChart pending slice has ● glyph');
assert(donutContent.includes("glyph: '▲'"), 'StatusDonutChart attention slice has ▲ glyph');

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('All Chart Color Standardization requirements verified successfully!');
}
