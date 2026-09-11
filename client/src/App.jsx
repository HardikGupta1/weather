import { useEffect, useRef, useState } from "react";

const DETAIL_ROWS = [
  { key: "feelsLike", label: "Feels like", unit: "°" },
  { key: "humidity", label: "Humidity", unit: "%" },
  { key: "windSpeed", label: "Wind", unit: " m/s" },
];

function IconIndicator({ icon, description }) {
  return (
    <img
      className="condition-icon"
      src={`https://openweathermap.org/img/wn/${icon}@2x.png`}
      alt={description}
      width={72}
      height={72}
    />
  );
}

function formatSuggestion(s) {
  return [s.name, s.state, s.country].filter(Boolean).join(", ");
}

export default function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef(null);
  const skipNextFetch = useRef(false);

  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }

    clearTimeout(debounceRef.current);

    if (city.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/cities?q=${encodeURIComponent(city.trim())}`);
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data : []);
        setShowSuggestions(true);
        setActiveIndex(-1);
      } catch {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [city]);

  async function fetchWeather(params) {
    setStatus("loading");
    setError("");
    setShowSuggestions(false);

    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`/api/weather?${query}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Couldn't fetch weather for that city.");
      }

      setWeather(data);
      setStatus("ready");
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    const query = city.trim();
    if (!query) return;
    fetchWeather({ city: query });
  }

  function handleSelectSuggestion(place) {
    skipNextFetch.current = true;
    setCity(formatSuggestion(place));
    setSuggestions([]);
    setShowSuggestions(false);
    fetchWeather({ lat: place.lat, lon: place.lon });
  }

  function handleKeyDown(e) {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  return (
    <div className="page">
      <header className="masthead">
        <span className="masthead-mark">Weathervane</span>
        <form className="search" onSubmit={handleSearch} autoComplete="off">
          <div className="search-field">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
              onKeyDown={handleKeyDown}
              placeholder="Search a city — Lisbon, Jaipur, Nairobi..."
              aria-label="City name"
              role="combobox"
              aria-expanded={showSuggestions && suggestions.length > 0}
              aria-autocomplete="list"
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul className="suggestions" role="listbox">
                {suggestions.map((s, i) => (
                  <li
                    key={`${s.name}-${s.lat}-${s.lon}`}
                    role="option"
                    aria-selected={i === activeIndex}
                    className={i === activeIndex ? "active" : ""}
                    onMouseDown={() => handleSelectSuggestion(s)}
                    onMouseEnter={() => setActiveIndex(i)}
                  >
                    <span className="suggestion-name">{s.name}</span>
                    <span className="suggestion-meta">
                      {[s.state, s.country].filter(Boolean).join(", ")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Searching" : "Search"}
          </button>
        </form>
      </header>

      <main className="stage">
        {status === "idle" && (
          <p className="prompt">
            Enter a city above to see the current conditions there.
          </p>
        )}

        {status === "error" && (
          <p className="prompt prompt-error">{error}</p>
        )}

        {status === "ready" && weather && (
          <section className="reading" aria-live="polite">
            <div className="reading-hero">
              <p className="place">
                {weather.city}
                {weather.country ? `, ${weather.country}` : ""}
              </p>
              <p className="temp">
                {Math.round(weather.temperature)}
                <span className="temp-unit">°C</span>
              </p>
              <div className="condition-row">
                <IconIndicator icon={weather.icon} description={weather.description} />
                <p className="condition-label">{weather.description}</p>
              </div>
            </div>

            <div className="reading-detail">
              {DETAIL_ROWS.map((row, i) => (
                <div className="detail-row" key={row.key}>
                  <span className="detail-index">{String(i + 1).padStart(2, "0")}</span>
                  <span className="detail-label">{row.label}</span>
                  <span className="detail-value">
                    {Math.round(weather[row.key])}
                    {row.unit}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}