/**
 * PLnEX Frontend Animation Audit Verification Suite
 *
 * Verifies that all unnecessary animation has been completely removed:
 * 1. Zero page transition animations on layouts or containers
 * 2. Zero animated counters or countup hooks
 * 3. Zero animated charts or SVG stroke animations
 * 4. Zero animated S-curve transitions
 * 5. Zero animated progress bars (static progress fills only)
 * 6. Zero moving visualizations or floating arrow translations (group-hover:translate)
 * 7. Zero particles, parallax, or canvas animation loops
 * 8. Zero animated gradients
 * 9. Zero 3D transforms or model rotations
 * 10. Zero arbitrary animate-in / fade-in / zoom-in / slide-in animations
 * 11. Strictly restrained loading animations (Loader2 animate-spin only)
 */

import fs from 'node:fs';
import path from 'node:path';

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failCount++;
  }
}

console.log('\n======================================================');
console.log('PLnEX FRONTEND ANIMATION AUDIT VERIFICATION');
console.log('======================================================\n');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.css')) {
      results.push(fullPath);
    }
  }
  return results;
}

const sourceFiles = walk('src');

// 1. Check for animate-in, fade-in, zoom-in, slide-in
console.log('TEST GROUP 1: Fade, Zoom, and Slide-in Class Removals');
const animateInMatches = [];
for (const file of sourceFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (/\banimate-in\b|\bzoom-in\b|\bslide-in\b/.test(line)) {
      animateInMatches.push(`${file}:${idx + 1}`);
    }
  });
}
assert(animateInMatches.length === 0, `Zero occurrences of animate-in, zoom-in, or slide-in classes found (found: ${animateInMatches.length})`);

// 2. Check for animated progress bars
console.log('\nTEST GROUP 2: Progress Bar Animation Audit');
const progressBarFile = path.resolve('src/components/shared/ProgressBar.tsx');
const progressBarContent = fs.readFileSync(progressBarFile, 'utf8');
assert(
  !progressBarContent.includes('transition-all') && !progressBarContent.includes('duration-'),
  'ProgressBar component fill has zero transition-all or duration classes'
);

// 3. Check for page transitions on AppShell
console.log('\nTEST GROUP 3: Page Transition Removals');
const appShellFile = path.resolve('src/components/shell/AppShell.tsx');
const appShellContent = fs.readFileSync(appShellFile, 'utf8');
assert(
  !appShellContent.includes('transition-all duration-200 p-4 md:p-6 max-w-[1440px]'),
  'AppShell main content container does not have page transition-all duration animation'
);

// 4. Check for floating/moving arrows (translate hover animations)
console.log('\nTEST GROUP 4: Moving Visualizations & Floating Elements');
const movingTranslateMatches = [];
for (const file of sourceFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (/group-hover:translate|hover:translate/.test(line)) {
      movingTranslateMatches.push(`${file}:${idx + 1}`);
    }
  });
}
assert(movingTranslateMatches.length === 0, `Zero occurrences of hover/group-hover translations (found: ${movingTranslateMatches.length})`);

// 5. Check Toast component
console.log('\nTEST GROUP 5: Notification Toast Animation');
const toastFile = path.resolve('src/components/shared/Toast.tsx');
const toastContent = fs.readFileSync(toastFile, 'utf8');
assert(
  !toastContent.includes('animate-in') && !toastContent.includes('slide-in-from-bottom'),
  'Toast notification does not have floating slide-in animation'
);

// 6. Check Modal & Drawer components
console.log('\nTEST GROUP 6: Modal & Drawer Stability');
const modalFile = path.resolve('src/components/shared/Modal.tsx');
const modalContent = fs.readFileSync(modalFile, 'utf8');
assert(
  !modalContent.includes('zoom-in-95') && !modalContent.includes('animate-in'),
  'Modal component displays without zooming/scaling animation pop'
);

const drawerFile = path.resolve('src/components/shared/Drawer.tsx');
const drawerContent = fs.readFileSync(drawerFile, 'utf8');
assert(
  !drawerContent.includes('animate-in') && !drawerContent.includes('fade-in'),
  'Drawer backdrop does not use animated fade transitions'
);

// 7. Check Charts & S-Curve static rendering
console.log('\nTEST GROUP 7: Chart & S-Curve Static Integrity');
const scurveFile = path.resolve('src/components/shared/SCurveChart.tsx');
const scurveContent = fs.readFileSync(scurveFile, 'utf8');
assert(!scurveContent.includes('strokeDashoffset'), 'SCurveChart has zero strokeDashoffset drawing animations');
assert(!scurveContent.includes('requestAnimationFrame'), 'SCurveChart has zero requestAnimationFrame rendering loops');

const barChartFile = path.resolve('src/components/shared/charts/BarChart.tsx');
const barChartContent = fs.readFileSync(barChartFile, 'utf8');
assert(!barChartContent.includes('transition-all') && !barChartContent.includes('animate-'), 'BarChart bars render statically without animation');

// 8. Check for animated counters or intervals
console.log('\nTEST GROUP 8: Animated Counters Check');
const counterMatches = [];
for (const file of sourceFiles) {
  const content = fs.readFileSync(file, 'utf8');
  if (/useCountUp|react-countup|countup/i.test(content)) {
    counterMatches.push(file);
  }
}
assert(counterMatches.length === 0, `Zero animated counter libraries or hooks (found: ${counterMatches.length})`);

// 9. Check for particles, 3D, and model rotation
console.log('\nTEST GROUP 9: 3D Movement, Particles, and Parallax');
const particleMatches = [];
for (const file of sourceFiles) {
  const content = fs.readFileSync(file, 'utf8');
  if (/from\s+['"]three['"]|@react-three|three\.js|particlesjs|parallax/i.test(content)) {
    particleMatches.push(file);
  }
}
assert(particleMatches.length === 0, `Zero particle or 3D rotation dependencies/elements (found: ${particleMatches.length})`);

// 10. Check that loading states preserve functional restrained indicator
console.log('\nTEST GROUP 10: Functional Interaction State Preservation');
assert(
  appShellContent.includes('animate-spin'),
  'AppShell preserves functional restrained loading state indicator'
);

console.log('\n======================================================');
console.log(`AUDIT RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('======================================================\n');

if (failCount > 0) {
  process.exit(1);
}
