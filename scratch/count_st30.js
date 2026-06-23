const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, 'haryana.svg'), 'utf8');

const regex = /<path[^>]*class="st30"[^>]*>/g;
let match;
let count = 0;

console.log('--- st30 PATHS ---');
while ((match = regex.exec(content)) !== null) {
  const tag = match[0];
  const idMatch = /id="([^"]+)"/.exec(tag);
  console.log(`Path ${count + 1}: ID = ${idMatch ? idMatch[1] : 'N/A'}`);
  count++;
}
console.log(`Total st30 paths: ${count}`);
