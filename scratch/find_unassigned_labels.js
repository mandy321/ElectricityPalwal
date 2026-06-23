const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, 'haryana.svg'), 'utf8');

// 1. Extract Text Labels
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

// 2. Extract ALL polygons and paths in the SVG
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
  const idMatch = /id="([^"]+)"/.exec(body);
  const classMatch = /class="([^"]+)"/.exec(body);
  const pointsMatch = /points="([\s\S]*?)"/.exec(body);
  if (idMatch && pointsMatch) {
    const centroid = getPolygonCentroid(pointsMatch[1]);
    if (centroid) shapes.push({ type: 'polygon', id: idMatch[1], class: classMatch ? classMatch[1] : 'none', centroid });
  }
}

// Extract Paths
const pathRegex = /<path([\s\S]*?)>/gi;
while ((match = pathRegex.exec(content)) !== null) {
  const body = match[1];
  const idMatch = /id="([^"]+)"/.exec(body);
  const classMatch = /class="([^"]+)"/.exec(body);
  const dMatch = /d="([\s\S]*?)"/.exec(body);
  if (idMatch && dMatch) {
    const centroid = getPathCentroid(dMatch[1]);
    if (centroid) shapes.push({ type: 'path', id: idMatch[1], class: classMatch ? classMatch[1] : 'none', centroid });
  }
}

// Map each label to its closest shapes
labels.forEach(label => {
  const sorted = shapes.map(shape => {
    const dx = shape.centroid.x - label.x;
    const dy = shape.centroid.y - label.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return { id: shape.id, type: shape.type, class: shape.class, dist };
  }).sort((a, b) => a.dist - b.dist);
  
  console.log(`District: ${label.name} [${label.x.toFixed(1)}, ${label.y.toFixed(1)}]`);
  console.log(`  1. ID: ${sorted[0].id} (class: ${sorted[0].class}, dist: ${sorted[0].dist.toFixed(1)})`);
  console.log(`  2. ID: ${sorted[1].id} (class: ${sorted[1].class}, dist: ${sorted[1].dist.toFixed(1)})`);
});
