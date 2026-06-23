const fs = require('fs');
const path = require('path');

const historyDir = path.join(__dirname, '../data/history');
const outputFilePath = path.join(__dirname, '../data/feeder_master.json');

const master = {};

if (!fs.existsSync(historyDir)) {
  console.error('History directory does not exist!');
  process.exit(1);
}

const files = fs.readdirSync(historyDir).filter(f => f.endsWith('.json'));

files.forEach(file => {
  const districtName = path.basename(file, '.json');
  console.log(`Processing history for: ${districtName}`);
  
  const filePath = path.join(historyDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  const feeders = new Set();
  const areas = new Set();
  
  data.forEach(item => {
    if (item.feeder) {
      feeders.add(item.feeder.trim());
    }
    if (item.area) {
      areas.add(item.area.trim());
    }
  });
  
  master[districtName] = {
    feeders: Array.from(feeders).sort(),
    areas: Array.from(areas).sort()
  };
  
  console.log(` -> Unique Feeders: ${feeders.size}, Unique Areas: ${areas.size}`);
});

fs.writeFileSync(outputFilePath, JSON.stringify(master, null, 2));
console.log(`Compiled master baseline successfully saved to ${outputFilePath}`);
