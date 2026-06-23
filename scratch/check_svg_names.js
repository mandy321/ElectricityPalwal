const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, 'haryana.svg'), 'utf8');

const districts = [
  'Palwal', 'Jind', 'Fatehabad', 'Sirsa', 'Hisar', 
  'Bhiwani', 'Mahendrgarh', 'Rewari', 'Gurugram', 
  'Nuh', 'Faridabad', 'Charkhi Dadri'
];

districts.forEach(dist => {
  const index = content.toLowerCase().indexOf(dist.toLowerCase());
  if (index !== -1) {
    console.log(`Found "${dist}" at index ${index}. Surrounding context:`);
    console.log(content.substring(index - 100, index + 100));
  } else {
    console.log(`"${dist}" NOT found.`);
  }
});
