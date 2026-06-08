const apiKey = 'b6fd43b5ec8af8ebd939ef6ad98e3f10'; // Free API key
const apiUrl = 'https://api.openweathermap.org/data/2.5/weather';

const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const cityName = document.getElementById('cityName');
const temperature = document.getElementById('temperature');
const description = document.getElementById('description');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('windSpeed');

searchBtn.addEventListener('click', fetchWeather);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        fetchWeather();
    }
});

async function fetchWeather() {
    const city = cityInput.value.trim();

    if (!city) {
        alert('Please enter a city name!');
        return;
    }

    try {
        const response = await fetch(`${apiUrl}?q=${city}&appid=${apiKey}&units=metric`);

        if (!response.ok) {
            alert('City not found! Please try again.');
            return;
        }

        const data = await response.json();

        // Update the UI with weather data
        cityName.textContent = `${data.name}, ${data.sys.country}`;
        temperature.textContent = `${Math.round(data.main.temp)}°C`;
        description.textContent = data.weather[0].main;
        humidity.textContent = `Humidity: ${data.main.humidity}%`;
        windSpeed.textContent = `Wind Speed: ${data.wind.speed} km/h`;

    } catch (error) {
        console.error('Error fetching weather:', error);
        alert('Error fetching weather data!');
    }
}

// Fetch weather for London on page load
window.addEventListener('load', () => {
    cityInput.value = 'London';
    fetchWeather();
}); 
