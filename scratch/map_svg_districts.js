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
    
    // Base coordinates inside tspan
    const bx = 456.45703;
    const by = 58.567803;
    
    const x = bx + dx;
    const y = by + dy;
    
    labels.push({ name, x, y });
  }
}

console.log(`Extracted ${labels.length} text labels.`);

// 2. Extract st30 Shapes (Polygons and Paths)
const shapes = [];

// Helper to compute centroid of polygon points
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

// Helper to compute centroid of path commands (approximation)
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
      if (centroid) {
        shapes.push({
          type: 'polygon',
          id: idMatch[1],
          centroid,
          rawAttr: `points="${pointsMatch[1].replace(/\s+/g, ' ').trim()}"`
        });
      }
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
      if (centroid) {
        shapes.push({
          type: 'path',
          id: idMatch[1],
          centroid,
          rawAttr: `d="${dMatch[1].replace(/\s+/g, ' ').trim()}"`
        });
      }
    }
  }
}

console.log(`Extracted ${shapes.length} st30 shapes.`);

// 3. Map Shapes to Closest Label
const mapping = [];
shapes.forEach(shape => {
  let closestLabel = null;
  let minDist = Infinity;
  
  labels.forEach(label => {
    const dx = shape.centroid.x - label.x;
    const dy = shape.centroid.y - label.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < minDist) {
      minDist = dist;
      closestLabel = label;
    }
  });
  
  if (closestLabel) {
    mapping.push({
      id: shape.id,
      type: shape.type,
      district: closestLabel.name,
      rawAttr: shape.rawAttr,
      dist: minDist
    });
  }
});

// Group by district to handle duplicates/overlaps
const districtToShapes = {};
mapping.forEach(m => {
  if (!districtToShapes[m.district]) {
    districtToShapes[m.district] = [];
  }
  districtToShapes[m.district].push(m);
});

console.log('\n--- MAPPING RESULTS ---');
Object.entries(districtToShapes).forEach(([dist, items]) => {
  console.log(`District: ${dist}`);
  items.forEach(item => {
    console.log(`  - Shape ID: ${item.id} (${item.type}), Distance: ${item.dist.toFixed(1)}`);
  });
});

// Save a clean JSON of the shape data to construct our inline SVG
fs.writeFileSync(path.join(__dirname, 'district_shapes.json'), JSON.stringify(mapping, null, 2));
console.log('\nSaved shapes mapping to district_shapes.json');
