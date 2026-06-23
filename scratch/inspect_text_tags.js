const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, 'haryana.svg'), 'utf8');

const textRegex = /<text[^>]*>([\s\S]*?)<\/text>/g;
let match;
let count = 0;

while ((match = textRegex.exec(content)) !== null && count < 5) {
  console.log(`Text Tag ${count + 1}:`);
  console.log(match[0]);
  console.log('----------------');
  count++;
}
