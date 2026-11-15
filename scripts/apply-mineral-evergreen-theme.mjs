import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(full));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
      results.push(full);
    }
  }
  return results;
}

// All files in src except tokens directory (which is already configured)
const allFiles = walk('src').filter((f) => {
  const norm = f.replace(/\\/g, '/');
  return !norm.includes('src/tokens/');
});

console.log(`Processing ${allFiles.length} files across src/...`);

// Replacement pairs ordered strategically (specific longer patterns first)
const replacements = [
  // 1. Light Status Badges & Roles (Explicit multi-attribute patterns)
  // Success
  [/bg-\[#E3EFE9\]/g, 'bg-[#E4F1E9]'],
  [/bg-\[#E5F6EE\]/g, 'bg-[#E4F1E9]'],
  [/text-\[#2E7D5B\]/g, 'text-[#1F6B4E]'],
  [/border-\[#B8DCC9\]/g, 'border-[#B7DAC3]'],

  // Warning
  [/text-\[#7A4B00\]/g, 'text-[#825700]'],
  [/text-\[#81500B\]/g, 'text-[#825700]'],
  [/text-\[#8C5311\]/g, 'text-[#825700]'],
  [/text-\[#D98B32\]/g, 'text-[#825700]'],
  [/bg-\[#FFF4DF\]/g, 'bg-[#F8EFDA]'],
  [/bg-\[#FDF6ED\]/g, 'bg-[#F8EFDA]'],
  [/bg-\[#FFF9F2\]/g, 'bg-[#F8EFDA]'],
  [/bg-\[#FFFCF7\]/g, 'bg-[#F8EFDA]'],
  [/border-\[#F6DCB1\]/g, 'border-[#E5C185]'],

  // Critical / Error / Danger
  [/bg-\[#FDF2EE\]/g, 'bg-[#F6E4E1]'],
  [/bg-\[#FAE8E2\]/g, 'bg-[#F6E4E1]'],
  [/bg-\[#FCEBE7\]/g, 'bg-[#F6E4E1]'],
  [/text-\[#C7522A\]/g, 'text-[#A43B36]'],
  [/text-\[#9C3210\]/g, 'text-[#A43B36]'],
  [/text-\[#92372F\]/g, 'text-[#A43B36]'],
  [/text-\[#B5473C\]/g, 'text-[#A43B36]'],
  [/border-\[#F4BFB0\]/g, 'border-[#DCABA7]'],
  [/border-\[#E8A38E\]/g, 'border-[#DCABA7]'],
  [/border-\[#F8CDC6\]/g, 'border-[#DCABA7]'],

  // Information
  [/bg-\[#E4F2F2\]/g, 'bg-[#E3EEF1]'],
  [/text-\[#005959\]/g, 'text-[#2C6475]'],
  [/border-\[#B3DDDD\]/g, 'border-[#AECFD6]'],

  // 2. Dark Status Badges
  // Dark Success
  [/dark:bg-\[#253621\]/g, 'dark:bg-[#20382C]'],
  [/dark:border-\[#3E5936\]/g, 'dark:border-[#315442]'],
  [/dark:text-\[#2E7D5B\]/g, 'dark:text-[#9AD5AF]'],

  // Dark Warning
  [/dark:bg-\[#4A2C10\]/g, 'dark:bg-[#3A3120]'],
  [/dark:border-\[#7A4C1B\]/g, 'dark:border-[#5B4A2B]'],

  // Dark Critical
  [/dark:bg-\[#4E1A0F\]/g, 'dark:bg-[#3B2422]'],
  [/dark:bg-\[#331517\]/g, 'dark:bg-[#3B2422]'],
  [/dark:text-\[#F28E7C\]/g, 'dark:text-[#FF9E94]'],
  [/dark:text-\[#F4A497\]/g, 'dark:text-[#FF9E94]'],
  [/dark:text-\[#F87171\]/g, 'dark:text-[#FF9E94]'],
  [/dark:border-\[#7A2A1A\]/g, 'dark:border-[#5B3734]'],
  [/dark:border-\[#5C2326\]/g, 'dark:border-[#5B3734]'],

  // Dark Info
  [/dark:bg-\[#1B342C\]/g, 'dark:bg-[#20353A]'],
  [/dark:border-\[#2D5548\]/g, 'dark:border-[#304E55]'],

  // 3. Canvas Surfaces & Backgrounds
  // Light Page Canvas
  [/bg-\[#FAF8F5\]/g, 'bg-[#F6F7F3]'],
  [/bg-\[#F4F7FB\]/g, 'bg-[#F6F7F3]'],
  [/bg-\[#F5F7FA\]/g, 'bg-[#F6F7F3]'],

  // Dark Page Canvas
  [/dark:bg-\[#240F08\]/g, 'dark:bg-[#101815]'],

  // Dark Card Surface
  [/dark:bg-\[#32150B\]/g, 'dark:bg-[#17221D]'],

  // Dark Raised & Inputs
  [/dark:bg-\[#4A1E10\]/g, 'dark:bg-[#243832]'],
  [/dark:bg-\[#642915\]/g, 'dark:bg-[#2D443D]'],
  [/dark:bg-\[#1B0B05\]/g, 'dark:bg-[#0B120F]'],

  // Light Raised / Sunken / Hover
  [/bg-\[#F2ECE0\]/g, 'bg-[#EAF0E9]'],
  [/bg-\[#EAF1F5\]/g, 'bg-[#EAF0E9]'],
  [/bg-\[#ECE7DB\]/g, 'bg-[#EAF0E9]'],
  [/bg-\[#F2EFE8\]/g, 'bg-[#E2EAE1]'],
  [/hover:bg-\[#F2ECE0\]/g, 'hover:bg-[#EAF0E9]'],
  [/hover:bg-\[#EAF1F5\]/g, 'hover:bg-[#EAF0E9]'],
  [/hover:bg-\[#EAE5D9\]/g, 'hover:bg-[#D9E2DA]'],
  [/dark:hover:bg-\[#4A1E10\]/g, 'dark:hover:bg-[#243832]'],
  [/dark:hover:bg-\[#562515\]/g, 'dark:hover:bg-[#3A5146]'],
  [/dark:hover:bg-\[#1F3048\]/g, 'dark:hover:bg-[#243832]'],
  [/dark:hover:bg-\[#32150B\]/g, 'dark:hover:bg-[#243832]'],

  // 4. Borders & Dividers
  [/border-\[#DDD6C6\]/g, 'border-[#D9E2DA]'],
  [/border-\[#D6E1E9\]/g, 'border-[#D9E2DA]'],
  [/dark:border-\[#562515\]/g, 'dark:border-[#3A5146]'],
  [/dark:border-\[#642915\]/g, 'dark:border-[#3A5146]'],
  [/divide-\[#DDD6C6\]/g, 'divide-[#D9E2DA]'],
  [/divide-\[#D6E1E9\]/g, 'divide-[#D9E2DA]'],
  [/divide-\[#EAF1F5\]/g, 'divide-[#D9E2DA]'],
  [/dark:divide-\[#562515\]/g, 'dark:divide-[#3A5146]'],

  // 5. Typography / Text
  // Light Main Text
  [/text-\[#004343\]/g, 'text-[#1A2B25]'],
  [/text-\[#1A2E42\]/g, 'text-[#1A2B25]'],
  [/text-\[#172638\]/g, 'text-[#1A2B25]'],
  [/text-\[#172033\]/g, 'text-[#1A2B25]'],

  // Dark Main Text
  [/dark:text-\[#FBF2C4\]/g, 'dark:text-[#F2F4E9]'],
  [/dark:text-\[#F5F5F0\]/g, 'dark:text-[#F2F4E9]'],

  // Light Secondary / Muted Text
  [/text-\[#3E5757\]/g, 'text-[#52665D]'],
  [/text-\[#52687B\]/g, 'text-[#52665D]'],
  [/text-\[#4D6565\]/g, 'text-[#52665D]'],
  [/text-\[#596579\]/g, 'text-[#52665D]'],

  // Dark Secondary / Muted Text
  [/dark:text-\[#D4BE98\]/g, 'dark:text-[#B5C1B5]'],
  [/dark:text-\[#A89070\]/g, 'dark:text-[#B5C1B5]'],
  [/dark:text-\[#93A3B8\]/g, 'dark:text-[#B5C1B5]'],
  [/dark:text-\[#94A3B8\]/g, 'dark:text-[#B5C1B5]'],

  // Subtle / Tertiary
  [/text-\[#6B8282\]/g, 'text-[#738A80]'],
  [/text-\[#7B8798\]/g, 'text-[#738A80]'],
  [/dark:text-\[#64748B\]/g, 'dark:text-[#859688]'],

  // 6. Primary Action Evergreen & Links
  [/bg-\[#008585\]/g, 'bg-[#006B61]'],
  [/bg-\[#0F6B68\]/g, 'bg-[#006B61]'],
  [/bg-\[#087F8C\]/g, 'bg-[#006B61]'],
  [/bg-\[#176B87\]/g, 'bg-[#006B61]'],
  [/text-\[#008585\]/g, 'text-[#006B61]'],
  [/text-\[#0F6B68\]/g, 'text-[#006B61]'],
  [/text-\[#087F8C\]/g, 'text-[#006B61]'],
  [/text-\[#176B87\]/g, 'text-[#006B61]'],
  [/border-\[#008585\]/g, 'border-[#006B61]'],
  [/border-\[#0F6B68\]/g, 'border-[#006B61]'],
  [/border-\[#087F8C\]/g, 'border-[#006B61]'],
  [/hover:bg-\[#003131\]/g, 'hover:bg-[#00524A]'],
  [/hover:bg-\[#135A72\]/g, 'hover:bg-[#00524A]'],
  [/hover:bg-\[#066974\]/g, 'hover:bg-[#00524A]'],
  [/focus:ring-\[#087F8C\]/g, 'focus:ring-[#006B61]'],
  [/focus:border-\[#087F8C\]/g, 'focus:border-[#006B61]'],
  [/focus:border-\[#004343\]/g, 'focus:border-[#006B61]'],

  // Dark Primary Action / Mint
  [/dark:bg-\[#74A892\]/g, 'dark:bg-[#72C6AD]'],
  [/dark:bg-\[#B8CDAB\]/g, 'dark:bg-[#72C6AD]'],
  [/dark:text-\[#74A892\]/g, 'dark:text-[#72C6AD]'],
  [/dark:text-\[#B8CDAB\]/g, 'dark:text-[#72C6AD]'],
  [/dark:border-\[#74A892\]/g, 'dark:border-[#72C6AD]'],
  [/dark:border-\[#B8CDAB\]/g, 'dark:border-[#72C6AD]'],
  [/dark:hover:bg-\[#A2B994\]/g, 'dark:hover:bg-[#5CB69C]'],
  [/dark:hover:bg-\[#45B3A1\]/g, 'dark:hover:bg-[#5CB69C]'],
  [/dark:hover:border-\[#B8CDAB\]/g, 'dark:hover:border-[#72C6AD]'],
  [/dark:focus:border-\[#B8CDAB\]/g, 'dark:focus:border-[#72C6AD]'],

  // 7. S-Curve / Chart fills and strokes in raw inline styles or SVG
  [/fill="#FAF8F5"/g, 'fill="#F6F7F3"'],
  [/fill="#F4F7FB"/g, 'fill="#F6F7F3"'],
  [/fill="#240F08"/g, 'fill="#101815"'],
  [/fill="#32150B"/g, 'fill="#17221D"'],
  [/fill="#1A2E42"/g, 'fill="#1A2B25"'],
  [/fill="#52687B"/g, 'fill="#52665D"'],
  [/fill="#7B8798"/g, 'fill="#738A80"'],
  [/fill="#0F6B68"/g, 'fill="#006B61"'],
  [/fill="#008585"/g, 'fill="#006B61"'],
  [/stroke="#DDD6C6"/g, 'stroke="#D9E2DA"'],
  [/stroke="#D6E1E9"/g, 'stroke="#D9E2DA"'],
  [/stroke="#562515"/g, 'stroke="#3A5146"'],

  // 8. Remaining edge cases & dark contrast adjustments
  [/border-l-\[#0F6B68\]/g, 'border-l-[#006B61]'],
  [/border-l-\[#008585\]/g, 'border-l-[#006B61]'],
  [/dark:border-l-\[#74A892\]/g, 'dark:border-l-[#72C6AD]'],
  [/dark:border-l-\[#B8CDAB\]/g, 'dark:border-l-[#72C6AD]'],
  [/dark:border-l-\[#D4BE98\]/g, 'dark:border-l-[#B5C1B5]'],
  [/dark:hover:border-\[#D4BE98\]/g, 'dark:hover:border-[#B5C1B5]'],
  [/dark:focus:bg-\[#32150B\]/g, 'dark:focus:bg-[#17221D]'],
  [/hover:text-\[#135A72\]/g, 'hover:text-[#00524A]'],
  [/focus:ring-\[#0F6B68\]/g, 'focus:ring-[#006B61]'],
  [/border-l-\[#52687B\]/g, 'border-l-[#52665D]'],
  [/border-\[#52687B\]/g, 'border-[#52665D]'],
  [/bg-\[#D6E1E9\]/g, 'bg-[#D9E2DA]'],
  [/hover:bg-\[#D6E1E9\]/g, 'hover:bg-[#D9E2DA]'],
  [/text-\[#D6E1E9\]/g, 'text-[#D9E2DA]'],
  [/bg-\[#1A2E42\]/g, 'bg-[#103F39]'],
  [/text-\[#32150B\]/g, 'text-[#0B2822]'],
  [/bg-\[#FBF2C4\]/g, 'bg-[#F8EFDA]'],
  [/bg-\[#74A892\]/g, 'bg-[#72C6AD]'],
  [/text-\[#3B6EA8\]/g, 'text-[#2C6475]'],
  [/dark:text-\[#3B6EA8\]/g, 'dark:text-[#9CCBD4]'],
  [/dark:hover:bg-\[#1F304B\]/g, 'dark:hover:bg-[#243832]'],
  [/dark:active:bg-\[#2B3D5E\]/g, 'dark:active:bg-[#2D443D]'],
  [/active:bg-\[#C5CCD6\]/g, 'active:bg-[#D9E2DA]'],
  [/dark:text-\[#240F08\]/g, 'dark:text-[#0B2822]'],
  [/dark:text-\[#1B281E\]/g, 'dark:text-[#0B2822]'],
  [/dark:focus:bg-\[#4A1E10\]/g, 'dark:focus:bg-[#243832]'],
  [/dark:focus:border-\[#74A892\]/g, 'dark:focus:border-[#72C6AD]'],
  [/dark:hover:border-\[#74A892\]/g, 'dark:hover:border-[#72C6AD]'],
  [/dark:group-hover:text-\[#74A892\]/g, 'dark:group-hover:text-[#72C6AD]'],
  [/group-hover:text-\[#74A892\]/g, 'group-hover:text-[#006B61]'],
  [/dark:hover:bg-\[#48b2a1\]/g, 'dark:hover:bg-[#5CB69C]'],
  [/active:bg-\[#135A72\]/g, 'active:bg-[#003D37]'],
  [/active:bg-\[#D6E1E9\]/g, 'active:bg-[#D9E2DA]'],
  [/dark:bg-\[#562515\]/g, 'dark:bg-[#243832]'],
  [/dark:border-\[#4A1E10\]/g, 'dark:border-[#3A5146]'],
  [/dark:hover:text-\[#FBF2C4\]/g, 'dark:hover:text-[#F2F4E9]'],
  [/text-\[#FBF2C4\]/g, 'text-[#F2F4E9]'],
  [/text-\[#74A892\]/g, 'text-[#72C6AD]'],
  [/bg-\[#004343\]/g, 'bg-[#103F39]'],
  [/hover:bg-\[#003333\]/g, 'hover:bg-[#0C312C]'],
  [/border-\[#003333\]/g, 'border-[#235F56]'],
  [/border-\[#005555\]/g, 'border-[#235F56]'],
  [/border-\[#004343\]/g, 'border-[#235F56]'],
  [/hover:bg-\[#2F543F\]/g, 'hover:bg-[#0C312C]'],
  [/bg-\[#003333\]/g, 'bg-[#0C312C]'],
  [/bg-\[#F28E7C\]/g, 'bg-[#FF9E94]'],
  [/text-\[#F28E7C\]/g, 'text-[#FF9E94]'],
  [/bg-\[#B8CDAB\]/g, 'bg-[#72C6AD]'],
  [/text-\[#B8CDAB\]/g, 'text-[#72C6AD]'],

  // 9. Additional ring, accent, placeholder, and support page patterns
  [/placeholder-\[#D4BE98\]/g, 'placeholder-[#52665D] dark:placeholder-[#B5C1B5]'],
  [/dark:placeholder-\[#D4BE98\]\/70/g, 'dark:placeholder-[#B5C1B5]/70'],
  [/ring-\[#0F6B68\]/g, 'ring-[#006B61]'],
  [/dark:ring-\[#74A892\]/g, 'dark:ring-[#72C6AD]'],
  [/accent-\[#0F6B68\]/g, 'accent-[#006B61]'],
  [/dark:accent-\[#74A892\]/g, 'dark:accent-[#72C6AD]'],
  [/focus:ring-\[#004343\]/g, 'focus:ring-[#006B61]'],
  [/dark:focus:ring-\[#74A892\]/g, 'dark:focus:ring-[#72C6AD]'],
  [/border-b-2 border-\[#1A2E42\]/g, 'border-b-2 border-[#103F39]'],
  [/border-\[#1A2E42\]/g, 'border-[#103F39]'],
  [/dark:hover:bg-\[#240F08\]\/40/g, 'dark:hover:bg-[#101815]/40'],
  [/dark:hover:bg-\[#240F08\]/g, 'dark:hover:bg-[#101815]'],
  [/dark:hover:text-\[#240F08\]/g, 'dark:hover:text-[#0B2822]'],
  [/bg-\[#52687B\]/g, 'bg-[#52665D]'],
  [/text-\[#52687B\]/g, 'text-[#52665D]'],
  [/text-\[#0F6B68\]/g, 'text-[#006B61]'],
  [/bg-\[#7B8798\] dark:bg-\[#D4BE98\]/g, 'bg-[#738A80] dark:bg-[#B5C1B5]'],
  [/text-\[#D4BE98\]/g, 'text-[#B5C1B5]'],
  [/bg-\[#240F08\]/g, 'bg-[#101815]'],
  [/border-\[#562515\]/g, 'border-[#3A5146]'],
];

let totalReplacements = 0;
let modifiedFiles = 0;

for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  for (const [pattern, replacement] of replacements) {
    content = content.replace(pattern, replacement);
  }

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedFiles++;
    const count = (original.length - content.length) !== 0 ? Math.abs(original.length - content.length) : 1;
    totalReplacements += count;
  }
}

console.log(`[SUCCESS] Modified ${modifiedFiles} files with Mineral + Evergreen theme replacements!`);
