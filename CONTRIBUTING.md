# Contributing to Palwal(Haryana) Power Outage Tracker

First off, thank you for considering contributing to this project! It's people like you who make this tracker more reliable and useful for the community.

---

## 🛠️ Local Development Setup

To get set up locally and run the scraper or frontend:

### 1. Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (version 18 or higher)
- [npm](https://www.npmjs.com/)

### 2. Installation
Clone the repository and install the dependencies:
```bash
git clone https://github.com/mandy321/haryana-dhbvn-electricity-status.git
cd haryana-dhbvn-electricity-status
npm install
```

### 3. Install Playwright Browsers
Install the chromium binaries required for the scraper browser session:
```bash
npm run install-browsers
```

---

## 🧪 Testing the Scraper Locally

The scraper simulates user interaction with the DHBVN portal using Playwright. 

To run the crawler:
```bash
npm run scrape
```

### Scraper Verification Checklist
When testing modifications to `scraper.js`:
- Check that `data/outages.json` is generated correctly.
- Ensure the columns are properly parsed (e.g., Feeder name, Area name, Start time, Expected restoration time).
- Verify that standard time conversions behave as expected.

To run the static frontend dashboard:
```bash
# Serve the directory using any static file server
npx http-server .
```
Then open `http://localhost:8080` in your web browser.

---

## 🎨 Code Style Guidelines

To keep the codebase maintainable, please follow these conventions:

### JavaScript (Vanilla JS)
- Use descriptive variable and function names.
- Clean up resources: when rendering components (like Chart.js instances), ensure previous instances are properly `.destroy()`ed to avoid memory leaks.
- Always handle API/fetch failures gracefully (e.g., inside try-catch blocks) to ensure the client-side experience doesn't lock up.

### HTML & CSS
- Maintain a responsive mobile-first grid system.
- Follow the existing dark theme aesthetic (using the curated color variables defined in `style.css`).
- Use semantic HTML tags.

---

## 💡 Good First Issues

Looking for a way to get started? Here are some ideas:

1. **Improve reverse-geocoding resolution**: Improve geographical mapping keywords in `GEOMAP_TO_ID` in `app.js` to support matching more locality suburbs.
2. **Add more chart views**: Expand historical outage analysis to visualize outage distributions by hour of the day or day of the week.
3. **Accessibility (a11y) improvements**: Add screen-reader labels (`aria-label`) to navigation tabs and interactive SVG district map boundaries.
4. **Enhanced mobile search**: Optimize search box behaviors to instantly scroll users to relevant cards.

---

## 🚀 Submitting Your Changes

1. Fork the repository and create your branch from `main`.
2. Commit your changes with clear, descriptive commit messages.
3. Submit a Pull Request describing your changes and what issue they address.
