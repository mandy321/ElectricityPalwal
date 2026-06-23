const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, 'haryana.svg'), 'utf8');

// Find any polygon or path ID matching numbers near 110-130
const regex = /<(polygon|path)[^>]*id="(polygon|path|rect|g)?(\d+)"[^>]*>/gi;
let match;
const ids = [];

while ((match = regex.exec(content)) !== null) {
  ids.push({ tag: match[1], id: match[2] ? match[2] + match[3] : match[3] });
}

console.log('All shape IDs in SVG:');
console.log(ids.map(i => i.id).sort((a,b) => parseInt(a.replace(/\D/g,'')) - parseInt(b.replace(/\D/g,''))));
