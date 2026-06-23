const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, 'haryana.svg'), 'utf8');

// Print all text tags
const textRegex = /<text[^>]*>([\s\S]*?)<\/text>/g;
let match;
let textCount = 0;

console.log('--- TEXT LABELS ---');
while ((match = textRegex.exec(content)) !== null) {
  const textBody = match[0];
  const tspanMatch = /<tspan[^>]*>([^<]+)<\/tspan>/.exec(textBody);
  const xMatch = /x="([^"]+)"/.exec(textBody);
  const yMatch = /y="([^"]+)"/.exec(textBody);
  
  if (tspanMatch) {
    const textVal = tspanMatch[1].trim();
    console.log(`Text: ${textVal}, x: ${xMatch ? xMatch[1] : 'N/A'}, y: ${yMatch ? yMatch[1] : 'N/A'}`);
    textCount++;
  }
}
console.log(`Total Text Labels Found: ${textCount}`);
