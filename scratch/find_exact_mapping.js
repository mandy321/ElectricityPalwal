const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, 'haryana.svg'), 'utf8');

// 1. Extract Text Labels with Absolute Coordinates
const textRegex = /<text[^>]*>([\s\S]*?)<\/text>/gi;
const labels = [];
let match;

while ((match = textRegex.exec(content)) !== null) {
  const textBody = match[0];
  const tspanMatch = /<tspan[^>]*>([^<]+)<\/tspan>/.exec(textBody);
  const transformMatch = /transform="translate\(([^,)]+),([^)]+)\)"/.exec(textBody);
  
  if (tspanMatch && transformMatch) {
    const name = tspanMatch[1].trim().replace(/\s+/g, ' ');
    const dx = parseFloat(transformMatch[1]);
    const dy = parseFloat(transformMatch[2]);
    const x = 456.45703 + dx;
    const y = 58.567803 + dy;
    labels.push({ name, x, y });
  }
}

// 2. Extract st30 shapes
const shapes = [];

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

function getPathCentroid(dStr) {
  const nums = dStr.match(/[-+]?[0-9]*\.?[0-9]+/g);
  if (!nums) return null;
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

// Extract Polygons
const polyRegex = /<polygon([\s\S]*?)>/gi;
while ((match = polyRegex.exec(content)) !== null) {
  const body = match[1];
  if (body.includes('class="st30"')) {
    const idMatch = /id="([^"]+)"/.exec(body);
    const pointsMatch = /points="([\s\S]*?)"/.exec(body);
    if (idMatch && pointsMatch) {
      const centroid = getPolygonCentroid(pointsMatch[1]);
      if (centroid) shapes.push({ type: 'polygon', id: idMatch[1], centroid, raw: pointsMatch[1] });
    }
  }
}

// Extract Paths
const pathRegex = /<path([\s\S]*?)>/gi;
while ((match = pathRegex.exec(content)) !== null) {
  const body = match[1];
  if (body.includes('class="st30"')) {
    const idMatch = /id="([^"]+)"/.exec(body);
    const dMatch = /d="([\s\S]*?)"/.exec(body);
    if (idMatch && dMatch) {
      const centroid = getPathCentroid(dMatch[1]);
      if (centroid) shapes.push({ type: 'path', id: idMatch[1], centroid, raw: dMatch[1] });
    }
  }
}

// Print Closest Labels for Each Shape
shapes.forEach(shape => {
  const sorted = labels.map(label => {
    const dx = shape.centroid.x - label.x;
    const dy = shape.centroid.y - label.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return { name: label.name, dist };
  }).sort((a, b) => a.dist - b.dist);
  
  console.log(`Shape ID: ${shape.id} (${shape.type}) at [${shape.centroid.x.toFixed(1)}, ${shape.centroid.y.toFixed(1)}]`);
  console.log(`  1. ${sorted[0].name} (dist: ${sorted[0].dist.toFixed(1)})`);
  console.log(`  2. ${sorted[1].name} (dist: ${sorted[1].dist.toFixed(1)})`);
  console.log(`  3. ${sorted[2].name} (dist: ${sorted[2].dist.toFixed(1)})`);
});
