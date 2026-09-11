import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const API_KEY = process.env.OPENWEATHER_API_KEY;

app.use(cors());
app.use(express.json());

// GET /api/weather?city=London  OR  /api/weather?lat=..&lon=..
app.get("/api/weather", async (req, res) => {
  const { city, lat, lon } = req.query;

  if ((!city || !city.trim()) && (!lat || !lon)) {
    return res.status(400).json({ error: "A city name is required." });
  }

  if (!API_KEY) {
    return res
      .status(500)
      .json({ error: "Server is missing an OpenWeather API key." });
  }

  try {
    const url =
      lat && lon
        ? `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
        : `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
            city
          )}&units=metric&appid=${API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (response.status !== 200) {
      const message =
        response.status === 404
          ? city
            ? `No city found matching "${city}".`
            : "No weather data found for that location."
          : data.message || "Something went wrong fetching the weather.";
      return res.status(response.status).json({ error: message });
    }

    res.json({
      city: data.name,
      country: data.sys?.country,
      temperature: data.main.temp,
      feelsLike: data.main.feels_like,
      condition: data.weather[0].main,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reach the weather service." });
  }
});

// GET /api/cities?q=Del  -> autocomplete suggestions
app.get("/api/cities", async (req, res) => {
  const { q } = req.query;

  if (!q || !q.trim() || q.trim().length < 2) {
    return res.json([]);
  }

  if (!API_KEY) {
    return res
      .status(500)
      .json({ error: "Server is missing an OpenWeather API key." });
  }

  try {
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
      q
    )}&limit=5&appid=${API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (response.status !== 200) {
      return res.status(response.status).json({ error: "Couldn't fetch city suggestions." });
    }

    const suggestions = data.map((place) => ({
      name: place.name,
      state: place.state,
      country: place.country,
      lat: place.lat,
      lon: place.lon,
    }));

    res.json(suggestions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reach the geocoding service." });
  }
});

app.listen(PORT, () => {
  console.log(`Weather server running on http://localhost:${PORT}`);
});