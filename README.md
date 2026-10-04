# SkyRoute — Weather &amp; Travel Planner

A premium, production-quality weather and travel planning web application built with vanilla HTML, CSS, and JavaScript.

---

## Overview

SkyRoute delivers real-time global weather data, animated atmospheric backgrounds, a 5-day forecast, city comparison, an interactive map, a smart trip planner, and a packing checklist — all in a polished, Apple Weather-inspired interface.

---

## Features

| Feature | Details |
|---|---|
| **Current Weather** | Temperature, feels-like, humidity, wind speed, pressure, visibility, sunrise/sunset |
| **Animated Atmosphere** | Canvas-based weather scenes: sun rays, stars/moon, rain, snow, clouds, lightning, fog |
| **5-Day Forecast** | Daily min/max, weather icon, condition, humidity derived from OpenWeatherMap 3-hour intervals |
| **Temperature Chart** | Chart.js line chart for the next 24 hours, updates on city or unit change |
| **Compare Cities** | Side-by-side premium cards for up to 3 cities using live API data |
| **Interactive Map** | Leaflet/OpenStreetMap with city marker and popup on search |
| **Trip Planner** | Destination, dates, activity selection; generates weather outlook and packing checklist |
| **Smart Packing Checklist** | Context-aware suggestions (rain, cold, hot, activity), custom items, LocalStorage persistence |
| **Saved Places** | Star-save cities from the dashboard; click to reload; remove at will; stored in LocalStorage |
| **Recent Searches** | Last 5 cities shown in the sidebar for quick re-search |
| **Unit Toggle** | Switch all temperatures (dashboard, forecast, chart, compare) between Celsius and Fahrenheit |
| **Responsive Design** | Desktop, tablet, and mobile layouts; collapsible sidebar on small screens |
| **Reduced Motion** | Respects `prefers-reduced-motion` — canvas animations disabled, transitions removed |
| **Accessibility** | ARIA roles, labels, keyboard navigation, focus states, semantic HTML |

---

## Technologies Used

- **HTML5** — Semantic structure, ARIA accessibility
- **CSS3** — Custom properties (design tokens), CSS Grid, Flexbox, glassmorphism, atmospheric gradients, keyframe animations
- **Vanilla JavaScript (ES6+)** — Async/await, Canvas API weather engine, LocalStorage, Chart.js, Leaflet.js
- **OpenWeatherMap API** — Current weather (`/weather`) and 5-day forecast (`/forecast`)
- **Chart.js** — Temperature trend line chart
- **Leaflet.js + OpenStreetMap** — Interactive destination map
- **Google Fonts** — Roboto (300, 400, 500, 600, 700)

---

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Edge, Firefox, Safari)
- Python 3 (for the local dev server) **or** any static file server
- An [OpenWeatherMap API key](https://openweathermap.org/api) (free tier works)

### Installation

```bash
# Clone or download the project
cd Weather-Forecast-App
```

### Run Locally

```bash
python -m http.server 8080
```

Then open **http://localhost:8080** in your browser.

> Do NOT open `index.html` directly as a `file://` URL — the Leaflet map and some browser security policies require an HTTP server.

---

## API Configuration

The API key is stored directly in `script.js` at line 2:

```js
const apiKey = "your_openweathermap_api_key_here";
```

**Important:** This project is a frontend-only application for portfolio/demo purposes. The API key is visible in client-side code. For production use, proxy API calls through a backend server and store the key in an environment variable.

---

## Project Structure

```
Weather-Forecast-App/
├── index.html      # Application structure and all section markup
├── style.css       # Complete design system (tokens, layout, components, responsive)
├── script.js       # All application logic (WeatherScene engine, API, charts, map, LocalStorage)
└── README.md       # This file
```

---

## Limitations

- **Forecast range:** OpenWeatherMap free tier provides forecasts up to 5 days in 3-hour intervals. Dates beyond 5 days in the Trip Planner show trend-based estimates only.
- **API key exposure:** The key is in frontend JavaScript. See API Configuration above.
- **No live weather radar:** The map shows city markers using geocoded coordinates, not live radar tiles.
- **No autocomplete:** City search requires an exact or near-exact city name.

---

## Screenshots

Run the app locally (see above) and search for any city to see the full interface, animated weather backgrounds, and responsive layout.

---

## Author

Built as a B.Tech CSE internship portfolio project.
