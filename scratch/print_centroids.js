const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, 'haryana.svg'), 'utf8');

const targetIds = ['polygon120', 'polygon122', 'polygon124', 'polygon130', 'polygon132', 'polygon140', 'polygon128', 'polygon116'];

function getPolygonCentroid(pointsStr) {
  const nums = pointsStr.trim().split(/[\s,]+/);
  let sumX = 0, sumY = 0, count = 0;
  for (let i = 0; i < nums.length - 1; i += 2) {
    const x = parseFloat(nums[i]);
    const y = parseFloat(nums[i+1]);
    if (!isNaN(x) && !isNaN(y)) {
      sumX += x;
      sumY += y;
      count++;
    }
  }
  return count > 0 ? { x: sumX / count, y: sumY / count } : null;
}

const polyRegex = /<polygon([\s\S]*?)>/gi;
let match;
while ((match = polyRegex.exec(content)) !== null) {
  const body = match[1];
  const idMatch = /id="([^"]+)"/.exec(body);
  const pointsMatch = /points="([\s\S]*?)"/.exec(body);
  if (idMatch && pointsMatch && targetIds.includes(idMatch[1])) {
    const centroid = getPolygonCentroid(pointsMatch[1]);
    console.log(`ID: ${idMatch[1]} at [${centroid.x.toFixed(1)}, ${centroid.y.toFixed(1)}]`);
  }
}
