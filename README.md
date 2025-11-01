# Location Information Dashboard

A comprehensive web application that provides location-based information including weather, air quality, news, and more. Built with Flask, Bootstrap, and integrated with multiple APIs.

## Features

### 🔐 Authentication
- User registration and login
- JWT-based authentication
- Secure API access

### 🌍 Location Services
- Location search with Google Maps API integration
- Device geolocation support
- Favorite locations management
- Search history tracking

### 🌤️ Weather & Climate
- Current weather conditions
- 5-day weather forecast
- Temperature, humidity, wind speed
- Weather icons and descriptions

### 🌬️ Air Quality Index (AQI)
- Real-time air quality monitoring
- Detailed pollutant concentrations (PM2.5, PM10, NO2, O3, CO)
- Health implications and cautionary statements
- AQI categories and color-coded indicators

### 📰 Regional News
- Location-based news headlines
- Top 5-10 recent articles
- Source attribution and timestamps
- Clickable article links

### 💾 Data Persistence
- localStorage for current location and user preferences
- Database storage for user data, favorites, and history

## Technologies Used

- **Backend**: Flask (Python)
- **Database**: SQLAlchemy with SQLite
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **UI Framework**: Bootstrap 5
- **Icons**: Bootstrap Icons
- **APIs**:
  - OpenWeatherMap (Weather & Air Quality)
  - Google Maps (Geocoding)
  - NewsAPI (Regional News)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sriharish00u/Location_Info_Dashboard.git
   cd Location_Info_Dashboard
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   # On Windows
   venv\Scripts\activate
   # On macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```
   SECRET_KEY=your-secret-key-here
   GOOGLE_MAPS_API_KEY=your-google-maps-api-key
   OPENWEATHER_API_KEY=your-openweather-api-key
   NEWS_API_KEY=your-news-api-key
   ```

5. **Run the application**
   ```bash
   python app.py
   ```

6. **Access the application**
   Open your browser and navigate to `http://127.0.0.1:5000`

## API Keys Setup

You'll need to obtain API keys from the following services:

1. **Google Maps API**: For location search and geocoding
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Maps JavaScript API and Geocoding API

2. **OpenWeatherMap API**: For weather and air quality data
   - Visit [OpenWeatherMap](https://openweathermap.org/api)
   - Sign up for a free account

3. **NewsAPI**: For regional news headlines
   - Visit [NewsAPI](https://newsapi.org/)
   - Sign up for a free account

## Project Structure

```
Location_Info_Dashboard/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── .env                   # Environment variables (not in repo)
├── instance/
│   └── app.db            # SQLite database
├── static/
│   ├── scripts.js        # Frontend JavaScript
│   ├── styles.css        # Custom CSS styles
│   └── logo.png          # Application logo
├── templates/
│   └── index.html        # Main HTML template
├── TODO.md               # Development roadmap
└── README.md            # This file
```

## Usage

1. **Register/Login**: Create an account or log in with existing credentials
2. **Search Location**: Enter a city name, address, or use device location
3. **View Information**: Explore weather, forecast, air quality, and news
4. **Manage Favorites**: Save frequently visited locations
5. **View History**: Check your search history

## Features in Detail

### Weather Display
- Real-time temperature, humidity, and wind speed
- Visual weather icons based on conditions
- Responsive card-based layout

### Air Quality Monitoring
- Comprehensive AQI with 6 categories (Good to Hazardous)
- Pollutant breakdown with progress bars
- Health recommendations based on AQI levels

### News Integration
- Location-aware news articles
- Clean card layout with source information
- Direct links to full articles

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Weather data provided by [OpenWeatherMap](https://openweathermap.org/)
- Geocoding services by [Google Maps](https://developers.google.com/maps)
- News data from [NewsAPI](https://newsapi.org/)
- UI components from [Bootstrap](https://getbootstrap.com/)

## Contact

Sri Harish - [GitHub](https://github.com/sriharish00u)

Project Link: [https://github.com/sriharish00u/Location_Info_Dashboard](https://github.com/sriharish00u/Location_Info_Dashboard)
