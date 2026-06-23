const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, 'haryana.svg');
const content = fs.readFileSync(svgPath, 'utf8');

const regex = /<path[^>]*>/g;
let match;
let count = 0;

console.log('--- PATHS FOUND ---');
while ((match = regex.exec(content)) !== null && count < 50) {
  const tag = match[0];
  const idMatch = /id="([^"]+)"/.exec(tag);
  const nameMatch = /name="([^"]+)"/.exec(tag);
  const classMatch = /class="([^"]+)"/.exec(tag);
  const titleMatch = /<title>([^<]+)<\/title>/.exec(content.substring(match.index, match.index + 200));
  
  if (idMatch || nameMatch || classMatch || titleMatch) {
    console.log(`Path ${count + 1}:`);
    console.log(`  Tag: ${tag.substring(0, 120)}...`);
    if (idMatch) console.log(`  ID: ${idMatch[1]}`);
    if (nameMatch) console.log(`  Name: ${nameMatch[1]}`);
    if (classMatch) console.log(`  Class: ${classMatch[1]}`);
    if (titleMatch) console.log(`  Title: ${titleMatch[1]}`);
    count++;
  }
}

if (count === 0) {
  console.log('No paths with ID/name/class/title attributes found in the first scan.');
}
