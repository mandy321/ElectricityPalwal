const fs = require('fs');
const path = require('path');

const outages = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/outages.json'), 'utf8'));
const palwalList = outages.districts['Palwal'] || [];

const nowISTStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
const nowIST = new Date(nowISTStr);
const nowTime = nowIST.getTime();

console.log('Current Local Time (IST):', nowISTStr);
console.log('Total Palwal Outages:', palwalList.length);

const activeOutages = [];
const filteredOutOutages = [];

function parseDHBVNDate(dateStr) {
  if (!dateStr || dateStr.toLowerCase().includes('pending') || dateStr.toLowerCase().includes('n/a') || dateStr.toLowerCase().includes('estimate')) return null;
  const parts = dateStr.trim().split(/\s+/);
  if (parts.length < 2) return null;
  const dateParts = parts[0].split('-');
  const timeParts = parts[1].split(':');
  if (dateParts.length < 3 || timeParts.length < 2) return null;
  
  const day = parseInt(dateParts[0], 10);
  const monthStr = dateParts[1].toLowerCase();
  const year = parseInt(dateParts[2], 10);
  
  const months = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
  };
  const month = months[monthStr.substring(0, 3)] || 0;
  
  const hours = parseInt(timeParts[0], 10);
  const minutes = parseInt(timeParts[1], 10);
  const seconds = timeParts[2] ? parseInt(timeParts[2], 10) : 0;
  
  const monthStr2Digit = (month + 1).toString().padStart(2, '0');
  const dayStr2Digit = day.toString().padStart(2, '0');
  const hourStr2Digit = hours.toString().padStart(2, '0');
  const minuteStr2Digit = minutes.toString().padStart(2, '0');
  const secondStr2Digit = seconds.toString().padStart(2, '0');
  
  const isoStr = `${year}-${monthStr2Digit}-${dayStr2Digit}T${hourStr2Digit}:${minuteStr2Digit}:${secondStr2Digit}+05:30`;
  return new Date(isoStr);
}

palwalList.forEach(item => {
  const end = parseDHBVNDate(item.expected_restoration_time);
  const isPast = end && end.getTime() < nowTime;
  if (isPast) {
    filteredOutOutages.push(item);
  } else {
    activeOutages.push(item);
  }
});

console.log('\n--- ACTIVE OUTAGES (Shown on dashboard) ---');
console.log('Count:', activeOutages.length);
activeOutages.slice(0, 10).forEach(o => {
  console.log(`- Feeder: ${o.feeder}, Area: ${o.area}`);
  console.log(`  Start: ${o.start_time}`);
  console.log(`  Expected Restoration: "${o.expected_restoration_time}"`);
});

console.log('\n--- FILTERED OUT (Past Expected Restoration Time but still returned by DHBVN API) ---');
console.log('Count:', filteredOutOutages.length);
filteredOutOutages.slice(0, 10).forEach(o => {
  console.log(`- Feeder: ${o.feeder}, Area: ${o.area}`);
  console.log(`  Start: ${o.start_time}`);
  console.log(`  Expected Restoration: "${o.expected_restoration_time}" (Passed at ${new Date(parseDHBVNDate(o.expected_restoration_time)).toLocaleString('en-US', {timeZone: 'Asia/Kolkata'})})`);
});
