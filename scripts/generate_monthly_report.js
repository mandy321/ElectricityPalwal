const fs = require('fs');
const path = require('path');

const historyDir = path.join(__dirname, '../data/history');
const reportsDir = path.join(__dirname, '../reports');
const manifestPath = path.join(reportsDir, 'manifest.json');

// Make sure output dir exists
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Helper to parse dates
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

// Get the previous month and year (or current month if --current is passed)
const args = process.argv.slice(2);
const generateCurrentMonth = args.includes('--current');

const now = new Date();
let targetMonth = now.getMonth() - (generateCurrentMonth ? 0 : 1);
let targetYear = now.getFullYear();
if (targetMonth < 0) {
  targetMonth = 11;
  targetYear -= 1;
}


const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const monthName = monthNames[targetMonth];
const reportId = `${(targetMonth + 1).toString().padStart(2, '0')}-${targetYear}`;
const reportFileName = `${monthName.toLowerCase()}-${targetYear}.html`;
const reportFilePath = path.join(reportsDir, reportFileName);

console.log(`Generating report for: ${monthName} ${targetYear} (ID: ${reportId})`);

// Read manifest
let manifest = [];
if (fs.existsSync(manifestPath)) {
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (e) {
    console.log('Failed to parse manifest, starting fresh.');
  }
}

// Find previous month's stats in manifest for comparisons
const prevMonthIndex = targetMonth - 1;
const prevMonthYear = prevMonthIndex < 0 ? targetYear - 1 : targetYear;
const prevMonthMod = prevMonthIndex < 0 ? 11 : prevMonthIndex;
const prevReportId = `${(prevMonthMod + 1).toString().padStart(2, '0')}-${prevMonthYear}`;
const prevMonthData = manifest.find(r => r.id === prevReportId);

const districtSummaries = {};

if (!fs.existsSync(historyDir)) {
  console.log('No history directory found. Exiting.');
  process.exit(0);
}

const files = fs.readdirSync(historyDir).filter(f => f.endsWith('.json'));

files.forEach(file => {
  const districtName = path.basename(file, '.json');
  const filePath = path.join(historyDir, file);
  
  let history = [];
  try {
    history = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.log(`Error reading ${file}: ${e.message}`);
    return;
  }
  
  // Filter history records to only include the target month
  const targetHistory = history.filter(item => {
    const timestamp = item.timestamp || (item.start_time ? parseDHBVNDate(item.start_time)?.getTime() : null);
    if (!timestamp) return false;
    const date = new Date(timestamp);
    return date.getMonth() === targetMonth && date.getFullYear() === targetYear;
  });
  
  if (targetHistory.length === 0) {
    districtSummaries[districtName] = {
      outages: 0,
      art: 0,
      worst_feeder: 'N/A',
      worst_week: 'N/A',
      trend: 0
    };
    return;
  }
  
  // 1. Total outages count
  const outagesCount = targetHistory.length;
  
  // 2. Average Restoration Time (ART)
  let totalDurationMs = 0;
  let validOutageCount = 0;
  targetHistory.forEach(item => {
    if (item.start_time && item.expected_restoration_time) {
      const start = parseDHBVNDate(item.start_time);
      const end = parseDHBVNDate(item.expected_restoration_time);
      if (start && end) {
        const diff = end.getTime() - start.getTime();
        if (diff > 60 * 1000 && diff < 24 * 60 * 60 * 1000) {
          totalDurationMs += diff;
          validOutageCount++;
        }
      }
    }
  });
  const avgFixTimeHours = validOutageCount > 0 ? (totalDurationMs / validOutageCount) / (1000 * 60 * 60) : 0;
  
  // 3. Worst Feeder (Most outages)
  const feederCounts = {};
  targetHistory.forEach(item => {
    if (item.feeder) {
      const f = item.feeder.trim();
      feederCounts[f] = (feederCounts[f] || 0) + 1;
    }
  });
  const worstFeeder = Object.entries(feederCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';
  
  // 4. Worst Week of Month
  const weekCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  targetHistory.forEach(item => {
    const timestamp = item.timestamp || (item.start_time ? parseDHBVNDate(item.start_time)?.getTime() : null);
    if (timestamp) {
      const date = new Date(timestamp);
      const day = date.getDate();
      const week = Math.min(5, Math.ceil(day / 7));
      weekCounts[week]++;
    }
  });
  const worstWeekIndex = Object.entries(weekCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';
  const worstWeekNames = {
    '1': 'Week 1 (1st - 7th)',
    '2': 'Week 2 (8th - 14th)',
    '3': 'Week 3 (15th - 21st)',
    '4': 'Week 4 (22nd - 28th)',
    '5': 'Week 5 (End of Month)',
    'N/A': 'N/A'
  };
  const worstWeek = worstWeekNames[worstWeekIndex];
  
  // 5. MoM comparison
  let momTrendPercent = 0;
  if (prevMonthData && prevMonthData.districts[districtName]) {
    const prevCount = prevMonthData.districts[districtName].outages || 0;
    if (prevCount > 0) {
      momTrendPercent = Math.round(((outagesCount - prevCount) / prevCount) * 100);
    } else {
      momTrendPercent = outagesCount > 0 ? 100 : 0;
    }
  }
  
  districtSummaries[districtName] = {
    outages: outagesCount,
    art: parseFloat(avgFixTimeHours.toFixed(1)),
    worst_feeder: worstFeeder,
    worst_week: worstWeek,
    trend: momTrendPercent
  };
});

// Update manifest
const manifestEntry = {
  id: reportId,
  name: `${monthName} ${targetYear}`,
  url: `reports/${reportFileName}`,
  districts: districtSummaries
};

// Remove if it already exists in manifest
manifest = manifest.filter(entry => entry.id !== reportId);
manifest.push(manifestEntry);
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

// Generate premium HTML page
let districtsGridHtml = '';
Object.entries(districtSummaries).forEach(([dist, stats]) => {
  const trendSign = stats.trend > 0 ? '+' : '';
  const trendClass = stats.trend > 0 ? 'trend-up' : (stats.trend < 0 ? 'trend-down' : 'trend-stable');
  const trendLabel = stats.trend === 0 ? 'Stable' : `${trendSign}${stats.trend}% vs last month`;
  
  districtsGridHtml += `
    <div class="district-report-card">
      <div class="card-header">
        <h3>${dist}</h3>
        <span class="trend-badge ${trendClass}">${trendLabel}</span>
      </div>
      <div class="card-body">
        <div class="stat-row">
          <span class="label">Total Outages:</span>
          <span class="val highlight">${stats.outages}</span>
        </div>
        <div class="stat-row">
          <span class="label">Avg. Fix Time:</span>
          <span class="val">${stats.art > 0 ? `${stats.art} hrs` : '--'}</span>
        </div>
        <div class="stat-row">
          <span class="label">Worst Feeder:</span>
          <span class="val worst-item" title="${stats.worst_feeder}">${stats.worst_feeder}</span>
        </div>
        <div class="stat-row">
          <span class="label">Worst Week:</span>
          <span class="val" style="font-size: 12px; font-weight: 500;">${stats.worst_week}</span>
        </div>
      </div>
    </div>
  `;
});

const htmlReport = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DHBVN Outages Health Report — ${monthName} ${targetYear}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    :root {
      --bg-dark: #090a0f;
      --card-bg: rgba(30, 41, 59, 0.4);
      --card-border: rgba(255, 255, 255, 0.08);
      --primary: #06b6d4;
      --text-muted: #94a3b8;
      --success: #10b981;
      --danger: #f43f5e;
    }
    body {
      background: var(--bg-dark);
      color: #f8fafc;
      font-family: 'Inter', sans-serif;
      margin: 0;
      padding: 0;
      min-height: 100vh;
      display: flex;
      justify-content: center;
    }
    .container {
      max-width: 1100px;
      width: 100%;
      padding: 40px 20px;
    }
    header {
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 24px;
      margin-bottom: 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    h1 {
      font-family: 'Outfit', sans-serif;
      font-size: 32px;
      margin: 0;
      color: #fff;
      font-weight: 700;
    }
    .back-btn {
      background: rgba(6, 182, 212, 0.1);
      border: 1px solid rgba(6, 182, 212, 0.2);
      color: var(--primary);
      padding: 8px 16px;
      border-radius: 8px;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease;
    }
    .back-btn:hover {
      background: var(--primary);
      color: #000;
    }
    .report-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 24px;
    }
    .district-report-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 20px;
      backdrop-filter: blur(16px);
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2);
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .card-header h3 {
      font-family: 'Outfit', sans-serif;
      font-size: 20px;
      font-weight: 600;
      margin: 0;
      color: #fff;
    }
    .trend-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 20px;
    }
    .trend-up { background: rgba(244, 63, 94, 0.15); color: var(--danger); }
    .trend-down { background: rgba(16, 185, 129, 0.15); color: var(--success); }
    .trend-stable { background: rgba(148, 163, 184, 0.15); color: var(--text-muted); }
    
    .stat-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .stat-row:last-child {
      margin-bottom: 0;
    }
    .label {
      color: var(--text-muted);
      font-size: 13px;
    }
    .val {
      font-weight: 600;
      font-size: 14px;
      color: #f1f5f9;
    }
    .val.highlight {
      font-size: 18px;
      color: var(--primary);
      text-shadow: 0 0 10px rgba(6, 182, 212, 0.2);
    }
    .val.worst-item {
      max-width: 60%;
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
      color: #fda4af;
    }
    footer {
      margin-top: 60px;
      text-align: center;
      font-size: 12px;
      color: var(--text-muted);
      border-top: 1px solid var(--card-border);
      padding-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>DHBVN Outages Health Report</h1>
        <p style="margin: 4px 0 0 0; color: var(--text-muted); font-size: 14px;">Summary analysis of grid reliability for the month of <strong>${monthName} ${targetYear}</strong>.</p>
      </div>
      <a href="../index.html" class="back-btn"><i class="fa-solid fa-arrow-left"></i> Dashboard</a>
    </header>
    
    <div class="report-grid">
      ${districtsGridHtml}
    </div>
    
    <footer>
      <p>Report compiled dynamically from historical logs by DHBVN Outage Tracker.</p>
    </footer>
  </div>
</body>
</html>
`;

fs.writeFileSync(reportFilePath, htmlReport);
console.log(`Monthly HTML report created: ${reportFilePath}`);
