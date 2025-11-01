let accessToken = localStorage.getItem('accessToken');
let currentLocation = JSON.parse(localStorage.getItem('currentLocation')) || null;
let userPreferences = JSON.parse(localStorage.getItem('userPreferences')) || {
    temperatureUnit: 'C',
    theme: 'light'
};

if (accessToken) {
    showDashboard();
    // Restore previous location if available
    if (currentLocation) {
        loadWeather();
        loadForecast();
        loadNews();
        loadAirQuality();
    }
}

function handleAuthFailure() {
    accessToken = null;
    localStorage.removeItem('accessToken');
    // Hide dashboard sections
    document.getElementById('location-category').style.display = 'none';
    document.getElementById('search-section').style.display = 'none';
    document.getElementById('weather-category').style.display = 'none';
    document.getElementById('weather-section').style.display = 'none';
    document.getElementById('forecast-section').style.display = 'none';
    document.getElementById('news-category').style.display = 'none';
    document.getElementById('news-section').style.display = 'none';
    document.getElementById('favorites-section').style.display = 'none';
    document.getElementById('history-section').style.display = 'none';
    document.getElementById('air-quality-section').style.display = 'none';
    // Show auth section
    document.getElementById('auth-section').style.display = 'block';
    alert('Your session has expired. Please log in again.');
}

document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    login();
});

document.getElementById('register-form').addEventListener('submit', function(e) {
    e.preventDefault();
    register();
});

function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.access_token) {
            accessToken = data.access_token;
            localStorage.setItem('accessToken', accessToken);
            showDashboard();
        } else {
            alert('Login failed: ' + (data.message || 'Unknown error'));
        }
    })
    .catch(error => {
        alert('Login error: ' + error.message);
    });
}

function showRegister() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('register-section').style.display = 'block';
}

function showLogin() {
    document.getElementById('register-section').style.display = 'none';
    document.getElementById('auth-section').style.display = 'block';
}

function register() {
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === 'User registered successfully') {
            alert('Registration successful! Please login.');
            showLogin();
        } else {
            alert('Registration failed: ' + (data.message || 'Unknown error'));
        }
    })
    .catch(error => {
        alert('Registration error: ' + error.message);
    });
}

function showDashboard() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('location-category').style.display = 'flex';
    document.getElementById('search-section').style.display = 'block';
    document.getElementById('favorites-section').style.display = 'block';
    document.getElementById('history-section').style.display = 'block';
    loadFavorites();
    loadHistory();
}

function searchLocation() {
    const query = document.getElementById('location-input').value;
    if (!query.trim()) {
        alert('Please enter a location to search');
        return;
    }
    fetch(`/location/search?q=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Authentication failed. Please login again.');
        }
        return response.json();
    })
    .then(data => {
        if (data.results && data.results.length > 0) {
            const location = data.results[0];
            currentLocation = {
                lat: location.geometry.location.lat,
                lon: location.geometry.location.lng,
                name: location.formatted_address
            };
            // Save current location to localStorage
            localStorage.setItem('currentLocation', JSON.stringify(currentLocation));
            loadWeather();
            loadForecast();
            loadNews();
            loadAirQuality();
        } else {
            alert('Location not found. Please try a different search term.');
        }
    })
    .catch(error => {
        alert('Search error: ' + error.message);
    });
}

function loadWeather() {
    if (!currentLocation) return;
    fetch(`/weather?lat=${currentLocation.lat}&lon=${currentLocation.lon}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    })
    .then(response => {
        if (!response.ok) {
            handleAuthFailure();
            return;
        }
        return response.json();
    })
    .then(data => {
        if (data) {
            document.getElementById('weather-category').style.display = 'flex';
            document.getElementById('weather-section').style.display = 'block';
            const emojiDesc = getWeatherEmojiAndDesc(data.weather[0].main, data.weather[0].description);
            document.getElementById('weather-data').innerHTML = `
                <h6>${data.name}</h6>
                <p>Temperature: ${data.main.temp}°C</p>
                <p>Humidity: ${data.main.humidity}%</p>
                <p>Wind Speed: ${data.wind.speed} m/s</p>
                <p>Description: ${emojiDesc}</p>
            `;
        }
    })
    .catch(error => {
        console.error('Weather load error:', error);
    });
}

function loadForecast() {
    if (!currentLocation) return;
    fetch(`/forecast?lat=${currentLocation.lat}&lon=${currentLocation.lon}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    })
    .then(response => {
        if (!response.ok) {
            handleAuthFailure();
            return;
        }
        return response.json();
    })
    .then(data => {
        if (data) {
            document.getElementById('weather-category').style.display = 'flex';
            document.getElementById('forecast-section').style.display = 'block';
            let forecastHtml = '<div class="row">';
            // Group by day and take midday forecast (around 12:00)
            const dailyForecasts = {};
            data.list.forEach(item => {
                const date = new Date(item.dt * 1000);
                const dayKey = date.toDateString();
                const hour = date.getHours();
                if (!dailyForecasts[dayKey] || Math.abs(hour - 12) < Math.abs(dailyForecasts[dayKey].hour - 12)) {
                    dailyForecasts[dayKey] = { ...item, hour };
                }
            });
            Object.values(dailyForecasts).slice(0, 5).forEach(item => {
                const date = new Date(item.dt * 1000);
                const emojiDesc = getWeatherEmojiAndDesc(item.weather[0].main, item.weather[0].description);
                forecastHtml += `
                    <div class="col-md-2 mb-3">
                        <div class="forecast-card card h-100">
                            <div class="card-body text-center">
                                <h6 class="card-title">${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</h6>
                                <div class="weather-icon mb-2">${emojiDesc.split(' ')[0]}</div>
                                <p class="mb-1 fw-bold">${item.main.temp}°C</p>
                                <p class="mb-1 small">${emojiDesc.split(' ').slice(1).join(' ')}</p>
                                <p class="mb-0 small text-muted">Humidity: ${item.main.humidity}%</p>
                            </div>
                        </div>
                    </div>
                `;
            });
            forecastHtml += '</div>';
            document.getElementById('forecast-data').innerHTML = forecastHtml;
        }
    })
    .catch(error => {
        console.error('Forecast load error:', error);
    });
}

function loadNews() {
    if (!currentLocation) return;
    fetch(`/news?location=${encodeURIComponent(currentLocation.name)}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    })
    .then(response => {
        if (!response.ok) {
            handleAuthFailure();
            return;
        }
        return response.json();
    })
    .then(data => {
        if (data) {
            document.getElementById('news-category').style.display = 'flex';
            document.getElementById('news-section').style.display = 'block';
            let newsHtml = '<div class="row">';
            data.articles.slice(0, 5).forEach(article => {
                const publishedDate = new Date(article.publishedAt).toLocaleDateString();
                newsHtml += `
                    <div class="col-md-6 mb-3">
                        <div class="news-card card h-100">
                            <div class="card-body">
                                <h6 class="card-title">
                                    <a href="${article.url}" target="_blank" class="text-decoration-none">${article.title}</a>
                                </h6>
                                <p class="card-text small text-muted mb-2">${article.description || 'No description available.'}</p>
                                <div class="d-flex justify-content-between align-items-center">
                                    <small class="text-muted">${article.source.name}</small>
                                    <small class="text-muted">${publishedDate}</small>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
            newsHtml += '</div>';
            document.getElementById('news-data').innerHTML = newsHtml;
        }
    })
    .catch(error => {
        console.error('News load error:', error);
    });
}

function loadFavorites() {
    fetch('/favorites', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    })
    .then(response => {
        if (!response.ok) {
            handleAuthFailure();
            return;
        }
        return response.json();
    })
    .then(data => {
        if (data) {
            let favHtml = '<div class="row">';
            data.forEach(fav => {
                favHtml += `
                    <div class="col-md-6 mb-3">
                        <div class="favorites-card card h-100">
                            <div class="card-body">
                                <h6 class="card-title">${fav.name}</h6>
                                <div class="d-flex justify-content-between">
                                    <button class="btn btn-primary btn-sm" onclick="setLocation(${fav.lat}, ${fav.lon}, '${fav.name}')">View</button>
                                    <button class="btn btn-danger btn-sm" onclick="removeFavorite(${fav.id})">Remove</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
            favHtml += '</div>';
            document.getElementById('favorites-list').innerHTML = favHtml;
        }
    })
    .catch(error => {
        console.error('Favorites load error:', error);
    });
}

function addFavorite() {
    if (!currentLocation) return;
    fetch('/favorites', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(currentLocation)
    })
    .then(response => {
        if (response.ok) {
            alert('Favorite added successfully!');
            loadFavorites();
        } else {
            alert('Failed to add favorite.');
        }
    })
    .catch(error => {
        console.error('Add favorite error:', error);
        alert('Error adding favorite.');
    });
}

function removeFavorite(id) {
    fetch(`/favorites/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
    })
    .then(response => {
        if (!response.ok) {
            handleAuthFailure();
            return;
        }
        loadFavorites();
    })
    .catch(error => {
        console.error('Remove favorite error:', error);
    });
}

function setLocation(lat, lon, name) {
    currentLocation = { lat, lon, name };
    // Save current location to localStorage
    localStorage.setItem('currentLocation', JSON.stringify(currentLocation));
    loadWeather();
    loadForecast();
    loadNews();
    loadAirQuality();
}

function loadHistory() {
    fetch('/history', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    })
    .then(response => {
        if (!response.ok) {
            handleAuthFailure();
            return;
        }
        return response.json();
    })
    .then(data => {
        if (data) {
            let historyHtml = '<div class="row">';
            data.forEach(item => {
                const timestamp = new Date(item.timestamp).toLocaleString();
                historyHtml += `
                    <div class="col-md-6 mb-3">
                        <div class="history-card card h-100">
                            <div class="card-body">
                                <h6 class="card-title">${item.query}</h6>
                                <p class="card-text small text-muted">${timestamp}</p>
                            </div>
                        </div>
                    </div>
                `;
            });
            historyHtml += '</div>';
            document.getElementById('history-list').innerHTML = historyHtml;
        }
    })
    .catch(error => {
        console.error('History load error:', error);
    });
}

function loadAirQuality() {
    if (!currentLocation) return;
    fetch(`/air-quality?lat=${currentLocation.lat}&lon=${currentLocation.lon}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    })
    .then(response => {
        if (!response.ok) {
            handleAuthFailure();
            return;
        }
        return response.json();
    })
    .then(data => {
        if (data) {
            document.getElementById('air-quality-section').style.display = 'block';
            if (data.list && data.list.length > 0) {
                const aqi = data.list[0].main.aqi;
                const components = data.list[0].components;
                const aqiClass = getAQIClass(aqi);
                const aqiDescription = getAQIDescription(aqi);
                const healthImplications = getHealthImplications(aqi);
                const cautionaryStatement = getCautionaryStatement(aqi);

                document.getElementById('air-quality-data').innerHTML = `
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <h6>Air Quality Index (AQI)</h6>
                            <div class="d-flex align-items-center">
                                <span class="badge ${aqiClass} me-2" style="font-size: 1.2em; padding: 8px 12px;">${aqi}</span>
                                <span class="fw-bold">${aqiDescription}</span>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <h6>Health Implications</h6>
                            <p class="mb-1">${healthImplications}</p>
                            <p class="text-muted small">${cautionaryStatement}</p>
                        </div>
                    </div>

                    <h6>Pollutant Concentrations</h6>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-2">
                                <div class="d-flex justify-content-between">
                                    <span class="pollutant-label">PM<sub>2.5</sub> (Fine particles)</span>
                                    <span>${components.pm2_5.toFixed(1)} µg/m³</span>
                                </div>
                                <div class="progress pollutant-bar" style="background-color: #e9ecef;">
                                    <div class="progress-bar bg-primary" style="width: ${Math.min(components.pm2_5 / 50 * 100, 100)}%"></div>
                                </div>
                            </div>
                            <div class="mb-2">
                                <div class="d-flex justify-content-between">
                                    <span class="pollutant-label">PM<sub>10</sub> (Coarse particles)</span>
                                    <span>${components.pm10.toFixed(1)} µg/m³</span>
                                </div>
                                <div class="progress pollutant-bar" style="background-color: #e9ecef;">
                                    <div class="progress-bar bg-success" style="width: ${Math.min(components.pm10 / 100 * 100, 100)}%"></div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-2">
                                <div class="d-flex justify-content-between">
                                    <span class="pollutant-label">NO<sub>2</sub> (Nitrogen dioxide)</span>
                                    <span>${components.no2.toFixed(1)} µg/m³</span>
                                </div>
                                <div class="progress pollutant-bar" style="background-color: #e9ecef;">
                                    <div class="progress-bar bg-warning" style="width: ${Math.min(components.no2 / 100 * 100, 100)}%"></div>
                                </div>
                            </div>
                            <div class="mb-2">
                                <div class="d-flex justify-content-between">
                                    <span class="pollutant-label">O<sub>3</sub> (Ozone)</span>
                                    <span>${components.o3.toFixed(1)} µg/m³</span>
                                </div>
                                <div class="progress pollutant-bar" style="background-color: #e9ecef;">
                                    <div class="progress-bar bg-info" style="width: ${Math.min(components.o3 / 100 * 100, 100)}%"></div>
                                </div>
                            </div>
                            <div class="mb-2">
                                <div class="d-flex justify-content-between">
                                    <span class="pollutant-label">CO (Carbon monoxide)</span>
                                    <span>${components.co.toFixed(1)} µg/m³</span>
                                </div>
                                <div class="progress pollutant-bar" style="background-color: #e9ecef;">
                                    <div class="progress-bar bg-secondary" style="width: ${Math.min(components.co / 10000 * 100, 100)}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="mt-3">
                        <h6>AQI Categories</h6>
                        <div class="row text-center">
                            <div class="col-2">
                                <div class="aqi-good p-2 mb-1">Good</div>
                                <small>0-50</small>
                            </div>
                            <div class="col-2">
                                <div class="aqi-fair p-2 mb-1">Fair</div>
                                <small>51-100</small>
                            </div>
                            <div class="col-2">
                                <div class="aqi-moderate p-2 mb-1">Moderate</div>
                                <small>101-150</small>
                            </div>
                            <div class="col-2">
                                <div class="aqi-poor p-2 mb-1">Poor</div>
                                <small>151-200</small>
                            </div>
                            <div class="col-2">
                                <div class="aqi-very-poor p-2 mb-1">Very Poor</div>
                                <small>201-300</small>
                            </div>
                            <div class="col-2">
                                <div class="aqi-hazardous p-2 mb-1">Hazardous</div>
                                <small>301+</small>
                            </div>
                        </div>
                    </div>
                `;
            }
        }
    })
    .catch(error => {
        console.error('Air quality load error:', error);
    });
}

function getAQIDescription(aqi) {
    if (aqi <= 1) return 'Good';
    if (aqi <= 2) return 'Fair';
    if (aqi <= 3) return 'Moderate';
    if (aqi <= 4) return 'Poor';
    if (aqi <= 5) return 'Very Poor';
    return 'Hazardous';
}

function getAQIClass(aqi) {
    if (aqi <= 1) return 'aqi-good';
    if (aqi <= 2) return 'aqi-fair';
    if (aqi <= 3) return 'aqi-moderate';
    if (aqi <= 4) return 'aqi-poor';
    if (aqi <= 5) return 'aqi-very-poor';
    return 'aqi-hazardous';
}

function getHealthImplications(aqi) {
    if (aqi <= 1) return 'Air quality is satisfactory, and air pollution poses little or no risk.';
    if (aqi <= 2) return 'Air quality is acceptable; however, for some pollutants there may be a moderate health concern for a very small number of people.';
    if (aqi <= 3) return 'Members of sensitive groups may experience health effects. The general public is not likely to be affected.';
    if (aqi <= 4) return 'Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.';
    if (aqi <= 5) return 'Health alert: everyone may experience more serious health effects.';
    return 'Health warnings of emergency conditions. The entire population is more likely to be affected.';
}

function getCautionaryStatement(aqi) {
    if (aqi <= 1) return 'None';
    if (aqi <= 2) return 'Unusually sensitive people should consider reducing prolonged or heavy exertion.';
    if (aqi <= 3) return 'Active children and adults, and people with respiratory disease, such as asthma, should limit prolonged outdoor exertion.';
    if (aqi <= 4) return 'Active children and adults, and people with respiratory disease, such as asthma, should avoid prolonged outdoor exertion; everyone else, especially children, should limit prolonged outdoor exertion.';
    if (aqi <= 5) return 'Active children and adults, and people with respiratory disease, such as asthma, should avoid all outdoor exertion; everyone else, especially children, should limit outdoor exertion.';
    return 'Everyone should avoid all outdoor exertion.';
}

function getWeatherEmojiAndDesc(weatherMain, description) {
    switch(weatherMain) {
        case 'Clear': return '☀️ Sunny';
        case 'Clouds': return '☁️ Cloudy';
        case 'Rain': return '🌧️ Rainy';
        case 'Drizzle': return '🌦️ Light Rain';
        case 'Thunderstorm': return '⛈️ Stormy';
        case 'Snow': return '❄️ Snowy';
        case 'Mist': return '🌫️ Misty';
        case 'Fog': return '🌫️ Foggy';
        case 'Haze': return '🌫️ Hazy';
        default: return description;
    }
}

function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            // Reverse geocode to get location name
            fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, {
                headers: { 'User-Agent': 'LocationInfoApp/1.0' }
            })
            .then(response => response.json())
            .then(data => {
                currentLocation = {
                    lat: lat,
                    lon: lon,
                    name: data.display_name || `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`
                };
                loadWeather();
                loadForecast();
                loadNews();
            })
            .catch(error => {
                alert('Error getting location name: ' + error.message);
            });
        }, function(error) {
            alert('Error getting your location: ' + error.message);
        });
    } else {
        alert('Geolocation is not supported by this browser.');
    }
}
