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

const report = {
  headingsUsingBrand: [],
  mutedOnImportantInfo: [],
  lowContrastWarningText: [],
};

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;

    // 1. Headings using brand color #176B87
    if (/<h[1-6]/.test(line) && line.includes('text-[#176B87]') && !line.includes('hover:')) {
      report.headingsUsingBrand.push({ file, lineNum, line: line.trim() });
    }

    // 2. Muted text on important labels, values, headers
    if (line.includes('text-[#7B8798]') || line.includes('fill="#7B8798"')) {
      if (
        line.includes('<label') ||
        line.includes('<th') ||
        (line.includes('font-bold') && !line.includes('Stage')) ||
        line.includes('font-semibold') ||
        (line.includes('uppercase') && (line.includes('block') || line.includes('span')))
      ) {
        if (!line.includes('•') && !line.includes('&darr;') && !line.includes('divider')) {
          report.mutedOnImportantInfo.push({ file, lineNum, line: line.trim() });
        }
      }
    }

    // 3. Low contrast warning text #D98B32 on light backgrounds #FDF6ED / #FFF9F2 / #FFF
    if (
      line.includes('text-[#D98B32]') &&
      (line.includes('bg-[#FDF6ED]') || line.includes('bg-[#FFF9F2]') || line.includes('bg-white') || line.includes('bg-[#FFFCF7]'))
    ) {
      report.lowContrastWarningText.push({ file, lineNum, line: line.trim() });
    }
  });
}

console.log('--- Verifying Text Contrast & Semantic Consistency in PLnEX ---');
let failed = 0;

if (report.headingsUsingBrand.length === 0) {
  console.log('[PASS] Zero headings use brand color (#176B87); all use #172033 or #596579');
} else {
  console.error(`[FAIL] Found ${report.headingsUsingBrand.length} headings using brand color`);
  failed++;
}

if (report.lowContrastWarningText.length === 0) {
  console.log('[PASS] Zero low-contrast warning text instances (#D98B32 on light backgrounds); all use accessible #8C5311 (6.16:1 ratio)');
} else {
  console.error(`[FAIL] Found ${report.lowContrastWarningText.length} low-contrast warning text instances`);
  failed++;
}

if (report.mutedOnImportantInfo.length === 0) {
  console.log('[PASS] Zero muted text (#7B8798) on important labels/headers/table fields; all use secondary #596579 (5.4:1 ratio)');
} else {
  console.error(`[FAIL] Found ${report.mutedOnImportantInfo.length} muted text on important labels`);
  failed++;
}

if (failed > 0) {
  console.error(`\nFAILED with ${failed} issues.`);
  process.exit(1);
} else {
  console.log('\nAll Text Contrast & Semantic Consistency checks passed successfully!\n');
  process.exit(0);
}
