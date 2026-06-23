const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, 'haryana.svg'), 'utf8');

const regex = /<([a-zA-Z0-9:]+)[^>]*class="st30"[^>]*>/g;
let match;
let count = 0;

while ((match = regex.exec(content)) !== null) {
  console.log(`Element ${count + 1}: <${match[1]} ...>`);
  count++;
}
console.log(`Total: ${count}`);
