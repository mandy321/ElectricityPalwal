const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, 'haryana.svg'), 'utf8');

// Find all path tags
const pathRegex = /<path([\s\S]*?)>/gi;
let match;
let count = 0;

console.log('--- ROBUST st30 PATH DETAILS ---');
while ((match = pathRegex.exec(content)) !== null) {
  const body = match[1];
  if (body.includes('class="st30"')) {
    const idMatch = /id="([^"]+)"/.exec(body);
    const dMatch = /d="([\s\S]*?)"/.exec(body);
    
    if (idMatch && dMatch) {
      const cleanD = dMatch[1].replace(/\s+/g, ' ');
      console.log(`Path ${count + 1}: ID = ${idMatch[1]}, d = ${cleanD.substring(0, 50)}... (length: ${cleanD.length})`);
      count++;
    }
  }
}
console.log(`Total st30 paths robustly found: ${count}`);
