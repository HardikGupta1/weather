# Weathervane — Weather Dashboard

A city weather search built with React (Vite) on the frontend and Node.js/Express on the backend. The backend proxies the OpenWeather API so the API key never reaches the browser, and also powers city-name autocomplete suggestions.

## Features

- Search weather by city name
- Live autocomplete suggestions as you type (name, state, country)
- Keyboard navigation (↑ ↓ Enter Esc) in the suggestions list
- Displays city, temperature, weather condition, humidity, wind speed, and weather icon

## 1. Get an API key

Sign up at https://openweathermap.org/api and grab a free API key (the free tier can take a little while to activate after signup).

## 2. Backend setup

```bash
cd server
npm install
cp .env.example .env
# edit .env and paste your key into OPENWEATHER_API_KEY
npm run dev
```

The server starts on `http://localhost:5000` and exposes:
- `GET /api/weather?city=<name>` or `GET /api/weather?lat=<lat>&lon=<lon>`
- `GET /api/cities?q=<query>` — autocomplete suggestions

## 3. Frontend setup

In a second terminal:

```bash
cd client
npm install
npm run dev
```

Vite starts on `http://localhost:5173` and proxies `/api/*` requests to the backend (see `vite.config.js`), so no CORS setup is needed in development.

## How it works

- Type a city — after 2+ characters, suggestions fetch from `/api/cities` (debounced).
- Select a suggestion (click or Enter) or submit the form — the app calls `/api/weather` on the Express server.
- The server calls OpenWeather's API with the key kept server-side, reshapes the response, and returns: city, temperature, condition, humidity, wind speed, feels-like, and the icon code.
- The UI renders the icon via OpenWeather's icon CDN and shows the rest in a two-column layout.

## Project structure

```
weather-dashboard/
├── server/
│   ├── server.js          # Express API proxy (weather + cities)
│   ├── package.json
│   └── .env.example
└── client/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx        # Search form, suggestions, results UI
        └── index.css
```

