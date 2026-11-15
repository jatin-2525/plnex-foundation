// Contrast ratio calculator for WCAG 2.2 AA verification

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.substring(0, 2), 16) / 255,
    g: parseInt(clean.substring(2, 4), 16) / 255,
    b: parseInt(clean.substring(4, 6), 16) / 255,
  };
}

function sRgbToLinear(c) {
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function getLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * sRgbToLinear(r) + 0.7152 * sRgbToLinear(g) + 0.0722 * sRgbToLinear(b);
}

function getContrast(hex1, hex2) {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return ((lighter + 0.05) / (darker + 0.05));
}

const colorPairs = [
  // Light Theme
  { role: 'Light: Main text on Page Canvas', fg: '#1A2B25', bg: '#F6F7F3', min: 4.5 },
  { role: 'Light: Main text on Card Surface', fg: '#1A2B25', bg: '#FFFFFF', min: 4.5 },
  { role: 'Light: Secondary text on Page Canvas', fg: '#52665D', bg: '#F6F7F3', min: 4.5 },
  { role: 'Light: Secondary text on Card Surface', fg: '#52665D', bg: '#FFFFFF', min: 4.5 },
  { role: 'Light: Secondary text on Raised Surface', fg: '#52665D', bg: '#EAF0E9', min: 4.5 },
  { role: 'Light: Primary Action Button', fg: '#FFFFFF', bg: '#006B61', min: 4.5 },
  { role: 'Light: Sidebar Nav Text on Dark Evergreen', fg: '#EEF3E8', bg: '#103F39', min: 4.5 },
  { role: 'Light: Sidebar Nav Active Brass Highlight', fg: '#E5C185', bg: '#103F39', min: 4.5 },
  { role: 'Light: Warm Brand Accent Text on White', fg: '#AC4B31', bg: '#FFFFFF', min: 4.5 },
  
  // Dark Theme
  { role: 'Dark: Main text on Dark Page Canvas', fg: '#F2F4E9', bg: '#101815', min: 4.5 },
  { role: 'Dark: Main text on Dark Card Surface', fg: '#F2F4E9', bg: '#17221D', min: 4.5 },
  { role: 'Dark: Secondary text on Dark Card Surface', fg: '#B5C1B5', bg: '#17221D', min: 4.5 },
  { role: 'Dark: Secondary text on Raised Surface', fg: '#B5C1B5', bg: '#243832', min: 4.5 },
  { role: 'Dark: Primary Action Button', fg: '#0B2822', bg: '#72C6AD', min: 4.5 },
  { role: 'Dark: Warm Brand Accent Text on Dark Card', fg: '#E58567', bg: '#17221D', min: 4.5 },
  { role: 'Dark: Brass Highlight Text on Dark Card', fg: '#E9C46A', bg: '#17221D', min: 4.5 },

  // Status Colors (Light)
  { role: 'Status Light: Success Text on Bg', fg: '#1F6B4E', bg: '#E4F1E9', min: 4.5 },
  { role: 'Status Light: Warning Text on Bg', fg: '#825700', bg: '#F8EFDA', min: 4.5 },
  { role: 'Status Light: Critical Text on Bg', fg: '#A43B36', bg: '#F6E4E1', min: 4.5 },
  { role: 'Status Light: Info Text on Bg', fg: '#2C6475', bg: '#E3EEF1', min: 4.5 },

  // Status Colors (Dark)
  { role: 'Status Dark: Success Text on Bg', fg: '#9AD5AF', bg: '#20382C', min: 4.5 },
  { role: 'Status Dark: Warning Text on Bg', fg: '#F3D27E', bg: '#3A3120', min: 4.5 },
  { role: 'Status Dark: Critical Text on Bg', fg: '#FF9E94', bg: '#3B2422', min: 4.5 },
  { role: 'Status Dark: Info Text on Bg', fg: '#9CCBD4', bg: '#20353A', min: 4.5 },
];

console.log('='.repeat(75));
console.log('PLnEX Mineral + Evergreen — WCAG 2.2 AA Contrast Compliance Audit');
console.log('='.repeat(75));

let failedCount = 0;

for (const pair of colorPairs) {
  const ratio = getContrast(pair.fg, pair.bg);
  const ratioStr = ratio.toFixed(2) + ':1';
  const pass = ratio >= pair.min;
  const status = pass ? '[PASS]' : '[FAIL]';
  
  if (!pass) failedCount++;
  
  console.log(`${status} ${pair.role.padEnd(46)} ${pair.fg} on ${pair.bg} -> ${ratioStr.padStart(8)} (req >= ${pair.min}:1)`);
}

console.log('='.repeat(75));
if (failedCount === 0) {
  console.log(`[VERDICT] 100% WCAG 2.2 Level AA COMPLIANT (0 failures out of ${colorPairs.length} pairs audited).`);
  process.exit(0);
} else {
  console.error(`[VERDICT] FAILED: ${failedCount} color pair(s) failed contrast threshold.`);
  process.exit(1);
}
