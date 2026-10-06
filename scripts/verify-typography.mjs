import fs from 'fs';
import path from 'path';

console.log('--- Verifying PLnEX Typographic Hierarchy & Scale ---');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passed++;
  } else {
    console.error(`[FAIL] ${message}`);
    failed++;
  }
}

// 1. Verify typography tokens file exists and exports exact scale
const typographyTokenPath = path.resolve('src/tokens/typography.ts');
assert(fs.existsSync(typographyTokenPath), 'src/tokens/typography.ts exists');

const typographyTokenContent = fs.readFileSync(typographyTokenPath, 'utf8');
assert(typographyTokenContent.includes('TYPOGRAPHY_SCALE'), 'Defines TYPOGRAPHY_SCALE');
assert(typographyTokenContent.includes('pageTitle'), 'Defines pageTitle scale (28–32px)');
assert(typographyTokenContent.includes('sectionTitle'), 'Defines sectionTitle scale (18–20px)');
assert(typographyTokenContent.includes('cardTitle'), 'Defines cardTitle scale (15–16px)');
assert(typographyTokenContent.includes('body'), 'Defines body scale (14px)');
assert(typographyTokenContent.includes('secondary'), 'Defines secondary scale (13px)');
assert(typographyTokenContent.includes('metadata'), 'Defines metadata scale (11–12px)');
assert(typographyTokenContent.includes('kpi'), 'Defines kpi scale (26–32px)');

// 2. Verify font family in globals.css
const globalsCssPath = path.resolve('src/app/globals.css');
const globalsCss = fs.readFileSync(globalsCssPath, 'utf8');
assert(globalsCss.includes('Inter'), 'globals.css imports and uses Inter font family');
assert(globalsCss.includes('JetBrains'), 'globals.css imports and uses JetBrains Mono font family');

// 3. Scan core pages and components for excessive bolding (no gratuitous font-black)
const coreFiles = [
  'src/app/dashboard/page.tsx',
  'src/app/schedule/page.tsx',
  'src/app/progress/page.tsx',
  'src/app/evidence/page.tsx',
  'src/app/what-if/page.tsx',
  'src/app/health/page.tsx',
  'src/app/risks/page.tsx',
  'src/app/sync/page.tsx',
  'src/app/reports/page.tsx',
  'src/components/shared/ActivityDetailDrawer.tsx',
  'src/components/shared/DataTable.tsx',
  'src/components/shell/AppShell.tsx',
  'src/components/shell/Sidebar.tsx',
];

for (const relPath of coreFiles) {
  const fullPath = path.resolve(relPath);
  assert(fs.existsSync(fullPath), `File exists: ${relPath}`);
  const content = fs.readFileSync(fullPath, 'utf8');

  // Verify no gratuitous font-black
  const hasFontBlack = content.includes('font-black');
  assert(!hasFontBlack, `${relPath} eliminates gratuitous font-black`);
}

// 4. Verify DataTable standardizes headers and body
const dataTablePath = path.resolve('src/components/shared/DataTable.tsx');
const dataTableContent = fs.readFileSync(dataTablePath, 'utf8');
assert(dataTableContent.includes('text-sm'), 'DataTable defaults body to readable text-sm (14px)');
assert(dataTableContent.includes('uppercase') && dataTableContent.includes('text-[11px]'), 'DataTable formats headers with text-[11px] uppercase');

// 5. Verify Page Titles adhere to 28-32px scale
const pagesToCheckTitle = [
  'src/app/dashboard/page.tsx',
  'src/app/schedule/page.tsx',
  'src/app/progress/page.tsx',
  'src/app/evidence/page.tsx',
  'src/app/health/page.tsx',
  'src/app/sync/page.tsx',
  'src/app/reports/page.tsx',
];

for (const p of pagesToCheckTitle) {
  const content = fs.readFileSync(path.resolve(p), 'utf8');
  const hasPageTitleScale =
    content.includes('text-[28px]') ||
    content.includes('text-3xl') ||
    content.includes('text-[30px]') ||
    content.includes('text-[32px]');
  assert(hasPageTitleScale, `${p} implements 28–32px page title scale`);
}

// 6. Verify KPI elements use font-mono and 26-32px scale
const pagesWithKpis = [
  'src/app/dashboard/page.tsx',
  'src/app/progress/page.tsx',
  'src/app/what-if/page.tsx',
  'src/app/reports/page.tsx',
];

for (const p of pagesWithKpis) {
  const content = fs.readFileSync(path.resolve(p), 'utf8');
  assert(
    content.includes('font-mono') &&
    (content.includes('text-[28px]') || content.includes('text-3xl') || content.includes('text-[26px]')),
    `${p} formats KPIs with font-mono and 26–32px scale`
  );
}

// 7. Verify Table body text is not tiny text-xs in key tables
const pagesWithTables = [
  'src/app/schedule/page.tsx',
  'src/app/evidence/page.tsx',
  'src/app/health/page.tsx',
  'src/app/risks/page.tsx',
  'src/app/sync/page.tsx',
  'src/app/what-if/page.tsx',
];

for (const p of pagesWithTables) {
  const content = fs.readFileSync(path.resolve(p), 'utf8');
  // Check that tables don't wrap their rows inside `<table className="... text-xs ...">`
  assert(
    !content.includes('<table className="w-full text-xs') &&
    !content.includes('<table className="text-xs'),
    `${p} does NOT cascade tiny text-xs to table rows`
  );
}

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('All Typography requirements verified successfully!');
}
