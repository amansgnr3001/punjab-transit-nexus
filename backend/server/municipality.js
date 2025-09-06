// Minimal Express API for the Real-Time-Bus-Tracking backend
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const bcrypt = require('bcrypt');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/realtime-bus-tracking';

// Models (direct imports)
const Bus = require('../models/Bus');
const Driver = require('../models/Driver');
const User = require('../models/Municipality');
const Tracking = require('../models/activebuses');
// CORS Configuration
const corsOptions = {
  origin: [
    'http://localhost:8080',  // Frontend Vite dev server
    'http://localhost:3000',  // Municipality server
    'http://localhost:3001',  // Driver server
    'http://localhost:3002',  // Passenger server
    'http://127.0.0.1:8080',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middleware
app.use(express.json());
app.use(cors(corsOptions));
app.use(morgan('dev'));

// MongoDB connection
mongoose.set('strictQuery', false);
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

// Helpers
async function hashPasswordIfPresent(obj) {
	if (obj && obj.password) {
		obj.password = await bcrypt.hash(obj.password, 10);
	}
}

// Generic error handler wrapper
function wrap(handler) {
	return async (req, res) => {
		try {
			await handler(req, res);
		} catch (err) {
			console.error(err);
			res.status(500).json({ error: 'Internal server error' });
		}
	};
}

// Basic API Routes

// Get all buses with active status
app.get('/api/municipality/buses', wrap(async (req, res) => {
	const buses = await Bus.find();
	const activeBuses = await Tracking.find({}, 'busNumberPlate');
	
	const activeBusNumbers = activeBuses.map(bus => bus.busNumberPlate);
	
	const busesWithStatus = buses.map(bus => ({
		...bus.toObject(),
		isactive: activeBusNumbers.includes(bus.Bus_number_plate)
	}));
	
	res.json(busesWithStatus);
}));

// Create bus with geocoding a
// nd directions
app.post('/api/municipality/buses', wrap(async (req, res) => {
	console.log('Received bus data:', JSON.stringify(req.body, null, 2));
	const busData = req.body;
	
	// Validate required fields
	if (!busData.Bus_number_plate || !busData.busName || !busData.schedules) {
		return res.status(400).json({ error: 'Missing required fields' });
	}
	
	try {
		// Process each schedule
		for (let schedule of busData.schedules) {
			console.log('Processing schedule:', schedule.startingPlace, 'to', schedule.destination);
			
			// Process each stop in the schedule
			for (let stop of schedule.stops) {
				console.log('Processing stop:', stop.name);
				
				try {
					// Get coordinates using geocoding API
					const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(stop.name)}&key=AIzaSyAzttkphjYlfyEbUoe-5NtAVexKsOI7924`;
					console.log('Geocoding URL:', geocodingUrl);
					
					const geocodingResponse = await fetch(geocodingUrl);
					const geocodingData = await geocodingResponse.json();
					
					console.log('Geocoding response status:', geocodingResponse.status);
					console.log('Geocoding response data:', JSON.stringify(geocodingData, null, 2));
					
					if (geocodingData.status === 'OK' && geocodingData.results && geocodingData.results.length > 0) {
						const location = geocodingData.results[0].geometry.location;
						stop.lat = location.lat;
						stop.long = location.lng;
						console.log('✅ Got coordinates:', location.lat, location.lng);
					} else {
						console.log('❌ No geocoding results for:', stop.name, 'Status:', geocodingData.status);
						console.log('❌ Error message:', geocodingData.error_message || 'No error message');
						stop.lat = 0;
						stop.long = 0;
					}
					
					// Get travel time using directions API
					const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(schedule.startingPlace)}&destination=${encodeURIComponent(stop.name)}&key=AIzaSyAzttkphjYlfyEbUoe-5NtAVexKsOI7924`;
					console.log('Directions URL:', directionsUrl);
					
					const directionsResponse = await fetch(directionsUrl);
					const directionsData = await directionsResponse.json();
					
					console.log('Directions response status:', directionsResponse.status);
					console.log('Directions response data:', JSON.stringify(directionsData, null, 2));
					
					if (directionsData.status === 'OK' && directionsData.routes && directionsData.routes.length > 0) {
						const duration = directionsData.routes[0].legs[0].duration.value;
						stop.time = duration;
						console.log('✅ Got travel time:', duration);
					} else {
						console.log('❌ No directions results for:', schedule.startingPlace, 'to', stop.name);
						console.log('❌ Directions status:', directionsData.status);
						console.log('❌ Directions error:', directionsData.error_message || 'No error message');
						stop.time = 0;
					}
				} catch (stopError) {
					console.error('Error processing stop:', stop.name, stopError);
					stop.lat = 0;
					stop.long = 0;
					stop.time = 0;
				}
			}
		}
	} catch (scheduleError) {
		console.error('Error processing schedules:', scheduleError);
		return res.status(500).json({ error: 'Failed to process schedules' });
	}
	
	// Save to database
	const bus = new Bus(busData);
	await bus.save();
	
	res.json(bus);
}));

// Get all buses

// Start server
app.listen(PORT, () => {
	console.log(`Municipality server running on port ${PORT}`);
});

module.exports = app;