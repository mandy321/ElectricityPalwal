const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, 'haryana.svg'), 'utf8');

const regex = /<path[^>]*class="st30"[^>]*>/g;
let match;
let count = 0;

console.log('--- st30 PATH DETAILS ---');
while ((match = regex.exec(content)) !== null) {
  const tag = match[0];
  const idMatch = /id="([^"]+)"/.exec(tag);
  const dMatch = /d="([^"]+)"/.exec(tag);
  
  if (idMatch && dMatch) {
    console.log(`Path ${count + 1}: ID = ${idMatch[1]}, d = ${dMatch[1].substring(0, 50)}... (length: ${dMatch[1].length})`);
    count++;
  }
}
