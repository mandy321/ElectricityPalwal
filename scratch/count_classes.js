const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, 'haryana.svg'), 'utf8');

const regex = /class="([^"]+)"/g;
const counts = {};
let match;

while ((match = regex.exec(content)) !== null) {
  const cls = match[1];
  counts[cls] = (counts[cls] || 0) + 1;
}

console.log('Class counts:');
console.log(counts);
