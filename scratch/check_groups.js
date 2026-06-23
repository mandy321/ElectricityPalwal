const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, 'haryana.svg'), 'utf8');

const groupRegex = /<g[^>]*>/g;
let match;
let count = 0;

console.log('--- GROUPS FOUND ---');
while ((match = groupRegex.exec(content)) !== null && count < 100) {
  const tag = match[0];
  const labelMatch = /inkscape:label="([^"]+)"/.exec(tag);
  const idMatch = /id="([^"]+)"/.exec(tag);
  
  if (labelMatch || idMatch) {
    console.log(`Group ${count + 1}: ${tag}`);
    count++;
  }
}
