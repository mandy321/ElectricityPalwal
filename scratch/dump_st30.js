const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, 'haryana.svg'), 'utf8');

const regex = /<path[^>]*st30[^>]*>/gi;
let match;
let count = 0;

while ((match = regex.exec(content)) !== null) {
  console.log(`Match ${count + 1}:`);
  console.log(match[Body = match[0]]);
  count++;
}
console.log(`Total: ${count}`);
