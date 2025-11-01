from flask import Flask, request, jsonify, render_template, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
import requests
import os
from dotenv import load_dotenv
import pycountry
import pymysql

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key')

db = SQLAlchemy(app)
jwt = JWTManager(app)

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    preferences = db.Column(db.JSON, default={})

class Location(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    lat = db.Column(db.Float, nullable=False)
    lon = db.Column(db.Float, nullable=False)
    is_favorite = db.Column(db.Boolean, default=False)

class SearchHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    search_query = db.Column(db.String(120), nullable=False)
    timestamp = db.Column(db.DateTime, default=db.func.current_timestamp())

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Email and password are required'}), 400
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({'message': 'Email already registered'}), 400
        hashed_password = generate_password_hash(data['password'], method='pbkdf2:sha256')
        new_user = User(email=data['email'], password=hashed_password)
        db.session.add(new_user)
        db.session.commit()
        return jsonify({'message': 'User registered successfully'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Registration failed: ' + str(e)}), 400

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    if user and check_password_hash(user.password, data['password']):
        access_token = create_access_token(identity=str(user.id))
        return jsonify({'access_token': access_token}), 200
    return jsonify({'message': 'Invalid credentials'}), 401

@app.route('/location/search', methods=['GET'])
@jwt_required()
def search_location():
    query = request.args.get('q')
    user_id = get_jwt_identity()

    # Save to search history
    search_entry = SearchHistory(user_id=user_id, search_query=query)
    db.session.add(search_entry)
    db.session.commit()

    # Use Nominatim (OpenStreetMap) for geocoding - free and no API key required
    url = f"https://nominatim.openstreetmap.org/search?q={query}&format=json&limit=1"
    response = requests.get(url, headers={'User-Agent': 'LocationInfoApp/1.0'})
    if response.status_code == 200:
        data = response.json()
        if data:
            result = data[0]
            return jsonify({
                "results": [{
                    "formatted_address": result.get('display_name'),
                    "geometry": {
                        "location": {
                            "lat": float(result['lat']),
                            "lng": float(result['lon'])
                        }
                    }
                }]
            })
    return jsonify({"error": "Location not found"}), 404

@app.route('/weather', methods=['GET'])
@jwt_required()
def get_weather():
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    api_key = os.getenv('OPENWEATHER_API_KEY')
    url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
    response = requests.get(url)
    return jsonify(response.json())

@app.route('/forecast', methods=['GET'])
@jwt_required()
def get_forecast():
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    api_key = os.getenv('OPENWEATHER_API_KEY')
    url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={api_key}&units=metric"
    response = requests.get(url)
    return jsonify(response.json())

@app.route('/news', methods=['GET'])
@jwt_required()
def get_news():
    query = request.args.get('location')
    api_key = os.getenv('NEWS_API_KEY')

    if not api_key:
        return jsonify({'error': 'News API key not configured'}), 500

    # Use the location name directly for regional news search
    url = f"https://newsapi.org/v2/everything?q={query}&apiKey={api_key}&pageSize=10"

    response = requests.get(url)
    if response.status_code != 200:
        return jsonify({'error': f'News API request failed with status {response.status_code}'}), 500

    data = response.json()
    if data.get('status') != 'ok':
        return jsonify({'error': data.get('message', 'News API error')}), 400

    return jsonify(data)

@app.route('/favorites', methods=['GET', 'POST'])
@jwt_required()
def manage_favorites():
    user_id = get_jwt_identity()
    if request.method == 'GET':
        favorites = Location.query.filter_by(user_id=user_id, is_favorite=True).all()
        return jsonify([{'id': f.id, 'name': f.name, 'lat': f.lat, 'lon': f.lon} for f in favorites])
    elif request.method == 'POST':
        data = request.get_json()
        new_fav = Location(user_id=user_id, name=data['name'], lat=data['lat'], lon=data['lon'], is_favorite=True)
        db.session.add(new_fav)
        db.session.commit()
        return jsonify({'message': 'Favorite added'}), 201

@app.route('/favorites/<int:fav_id>', methods=['DELETE'])
@jwt_required()
def delete_favorite(fav_id):
    user_id = get_jwt_identity()
    favorite = Location.query.filter_by(id=fav_id, user_id=user_id, is_favorite=True).first()
    if favorite:
        db.session.delete(favorite)
        db.session.commit()
        return jsonify({'message': 'Favorite removed'}), 200
    return jsonify({'message': 'Favorite not found'}), 404

@app.route('/history', methods=['GET'])
@jwt_required()
def get_search_history():
    user_id = get_jwt_identity()
    history = SearchHistory.query.filter_by(user_id=user_id).order_by(SearchHistory.timestamp.desc()).limit(10).all()
    return jsonify([{'query': h.search_query, 'timestamp': h.timestamp.isoformat()} for h in history])

@app.route('/air-quality', methods=['GET'])
@jwt_required()
def get_air_quality():
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    api_key = os.getenv('OPENWEATHER_API_KEY')
    url = f"https://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={api_key}"
    response = requests.get(url)
    return jsonify(response.json())

@app.route('/shutdown', methods=['POST'])
def shutdown():
    shutdown_func = request.environ.get('werkzeug.server.shutdown')
    if shutdown_func is None:
        raise RuntimeError('Not running with the Werkzeug Server')
    shutdown_func()
    return 'Server shutting down...'

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
