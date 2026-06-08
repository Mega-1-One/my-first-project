// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const geoBtn = document.getElementById('geoBtn');
const themeToggle = document.getElementById('themeToggle');
const cityName = document.getElementById('cityName');
const temperature = document.getElementById('temperature');
const description = document.getElementById('description');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('windSpeed');
const weatherIcon = document.getElementById('weatherIcon');
const forecastContainer = document.getElementById('forecastContainer');
const historyContainer = document.getElementById('historyContainer');
const favoritesContainer = document.getElementById('favoritesContainer');
const addFavoriteBtn = document.getElementById('addFavoriteBtn');

// State
let currentCity = '';
let currentLat = '';
let currentLon = '';

// Local Storage Keys
const HISTORY_KEY = 'weatherHistory';
const FAVORITES_KEY = 'weatherFavorites';
const THEME_KEY = 'theme';

// Initialize on page load
window.addEventListener('load', function() {
    console.log('Page loaded, initializing...');
    loadTheme();
    loadHistory();
    loadFavorites();
    cityInput.value = 'London';
    fetchWeather();
});

// Event Listeners
searchBtn.addEventListener('click', function() {
    console.log('Search button clicked');
    fetchWeather();
});

cityInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        console.log('Enter pressed');
        fetchWeather();
    }
});

geoBtn.addEventListener('click', function() {
    console.log('Geo button clicked');
    getGeolocation();
});

themeToggle.addEventListener('click', function() {
    console.log('Theme toggle clicked');
    toggleTheme();
});

addFavoriteBtn.addEventListener('click', function() {
    console.log('Add favorite clicked');
    addCurrentToFavorites();
});

// Fetch Weather by City Name
function fetchWeather() {
    const city = cityInput.value.trim();
    console.log('Fetching weather for:', city);

    if (!city) {
        alert('Please enter a city name!');
        return;
    }

    // Get coordinates
    fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`)
        .then(response => response.json())
        .then(geoData => {
            console.log('Geo data:', geoData);
            
            if (!geoData.results || geoData.results.length === 0) {
                alert('City not found! Please try again.');
                return;
            }

            const location = geoData.results[0];
            currentCity = location.name + ', ' + location.country_code;
            currentLat = location.latitude;
            currentLon = location.longitude;

            console.log('Location found:', currentCity, currentLat, currentLon);

            // Get current weather
            return fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${currentLat}&longitude=${currentLon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=celsius&timezone=auto`
            );
        })
        .then(response => response.json())
        .then(weatherData => {
            console.log('Weather data:', weatherData);
            const current = weatherData.current;
            const daily = weatherData.daily;

            // Update current weather
            updateCurrentWeather(current);

            // Update forecast
            updateForecast(daily);

            // Save to history
            saveToHistory(currentCity);

            // Scroll to current weather
            document.querySelector('.weather-container').scrollIntoView({ behavior: 'smooth' });
        })
        .catch(error => {
            console.error('Error fetching weather:', error);
            alert('Error fetching weather data!');
        });
}

// Update Current Weather Display
function updateCurrentWeather(data) {
    console.log('Updating current weather');
    cityName.textContent = currentCity;
    temperature.textContent = Math.round(data.temperature_2m) + '°C';
    description.textContent = getWeatherDescription(data.weather_code);
    humidity.textContent = 'Humidity: ' + data.relative_humidity_2m + '%';
    windSpeed.textContent = 'Wind Speed: ' + Math.round(data.wind_speed_10m) + ' km/h';
    weatherIcon.textContent = getWeatherEmoji(data.weather_code);
}

// Update 5-Day Forecast
function updateForecast(daily) {
    console.log('Updating forecast');
    forecastContainer.innerHTML = '';

    for (let i = 1; i < 6; i++) {
        const date = new Date(daily.time[i]);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const maxTemp = Math.round(daily.temperature_2m_max[i]);
        const minTemp = Math.round(daily.temperature_2m_min[i]);
        const code = daily.weather_code[i];

        const forecastCard = document.createElement('div');
        forecastCard.className = 'forecast-card';
        forecastCard.innerHTML = `
            <div>${dayName}</div>
            <div class="forecast-icon">${getWeatherEmoji(code)}</div>
            <div class="forecast-temp">${maxTemp}°C</div>
            <div>${minTemp}°C</div>
        `;
        forecastContainer.appendChild(forecastCard);
    }
}

// Get Geolocation
function getGeolocation() {
    console.log('Getting geolocation');
    if (navigator.geolocation) {
        geoBtn.textContent = '⏳';
        navigator.geolocation.getCurrentPosition(
            function(position) {
                currentLat = position.coords.latitude;
                currentLon = position.coords.longitude;
                console.log('Got location:', currentLat, currentLon);
                fetchWeatherByCoordinates();
                geoBtn.textContent = '📍';
            },
            function(error) {
                console.error('Geolocation error:', error);
                alert('Unable to get your location. Please enable location services.');
                geoBtn.textContent = '📍';
            }
        );
    } else {
        alert('Geolocation is not supported by your browser.');
    }
}

// Fetch Weather by Coordinates
function fetchWeatherByCoordinates() {
    console.log('Fetching weather by coordinates');
    // Get weather
    fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${currentLat}&longitude=${currentLon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=celsius&timezone=auto`
    )
    .then(response => response.json())
    .then(weatherData => {
        console.log('Weather data:', weatherData);
        const current = weatherData.current;
        const daily = weatherData.daily;

        currentCity = 'Current Location';
        cityInput.value = 'Current Location';
        updateCurrentWeather(current);
        updateForecast(daily);
        saveToHistory(currentCity);
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error getting weather for your location.');
    });
}

// Weather Code to Emoji Mapping
function getWeatherEmoji(code) {
    if (code === 0) return '☀️';
    if (code === 1 || code === 2) return '🌤️';
    if (code === 3) return '☁️';
    if (code === 45 || code === 48) return '🌫️';
    if (code === 51 || code === 53 || code === 55) return '🌧️';
    if (code === 61 || code === 63 || code === 65) return '🌧️';
    if (code === 71 || code === 73 || code === 75 || code === 77) return '❄️';
    if (code === 80 || code === 81 || code === 82) return '🌧️';
    if (code === 85 || code === 86) return '🌨️';
    if (code === 95 || code === 96 || code === 99) return '⛈️';
    return '🌡️';
}

// Weather Code to Description
function getWeatherDescription(code) {
    const descriptions = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Foggy',
        48: 'Depositing rime fog',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        61: 'Slight rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        71: 'Slight snow',
        73: 'Moderate snow',
        75: 'Heavy snow',
        77: 'Snow grains',
        80: 'Slight rain showers',
        81: 'Moderate rain showers',
        82: 'Violent rain showers',
        85: 'Slight snow showers',
        86: 'Heavy snow showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with slight hail',
        99: 'Thunderstorm with heavy hail'
    };
    return descriptions[code] || 'Unknown';
}

// Save to Search History
function saveToHistory(city) {
    console.log('Saving to history:', city);
    let history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    history = history.filter(h => h !== city);
    history.unshift(city);
    history = history.slice(0, 10);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    loadHistory();
}

// Load Search History
function loadHistory() {
    console.log('Loading history');
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    historyContainer.innerHTML = '';

    if (history.length === 0) {
        historyContainer.innerHTML = '<div class="empty-message">No search history yet</div>';
        return;
    }

    history.forEach(function(city) {
        const historyItem = document.createElement('button');
        historyItem.className = 'history-item';
        historyItem.type = 'button';
        historyItem.innerHTML = city + ' <span class="remove-btn">✕</span>';
        
        historyItem.addEventListener('click', function(e) {
            if (e.target.classList.contains('remove-btn')) {
                removeFromHistory(city);
            } else {
                cityInput.value = city.split(',')[0];
                fetchWeather();
            }
        });
        
        historyContainer.appendChild(historyItem);
    });
}

// Remove from History
function removeFromHistory(city) {
    console.log('Removing from history:', city);
    let history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    history = history.filter(h => h !== city);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    loadHistory();
}

// Add Current City to Favorites
function addCurrentToFavorites() {
    console.log('Adding to favorites');
    if (!currentCity) {
        alert('Search for a city first!');
        return;
    }

    let favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];

    if (favorites.includes(currentCity)) {
        alert('Already in favorites!');
        return;
    }

    favorites.push(currentCity);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    loadFavorites();
    alert('Added to favorites!');
}

// Load Favorites
function loadFavorites() {
    console.log('Loading favorites');
    const favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
    favoritesContainer.innerHTML = '';

    if (favorites.length === 0) {
        favoritesContainer.innerHTML = '<div class="empty-message">No favorite cities yet</div>';
        return;
    }

    favorites.forEach(function(city) {
        const favoriteItem = document.createElement('button');
        favoriteItem.className = 'favorite-item';
        favoriteItem.type = 'button';
        favoriteItem.innerHTML = '⭐ ' + city + ' <span class="remove-btn">✕</span>';
        
        favoriteItem.addEventListener('click', function(e) {
            if (e.target.classList.contains('remove-btn')) {
                removeFromFavorites(city);
            } else {
                cityInput.value = city.split(',')[0];
                fetchWeather();
            }
        });
        
        favoritesContainer.appendChild(favoriteItem);
    });
}

// Remove from Favorites
function removeFromFavorites(city) {
    console.log('Removing from favorites:', city);
    let favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
    favorites = favorites.filter(f => f !== city);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    loadFavorites();
}

// Dark Mode Toggle
function toggleTheme() {
    console.log('Toggling theme');
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    themeToggle.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
}

// Load Theme from Storage
function loadTheme() {
    console.log('Loading theme');
    const theme = localStorage.getItem(THEME_KEY) || 'light';
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.textContent = '☀️ Light Mode';
    } else {
        themeToggle.textContent = '🌙 Dark Mode';
    }
}