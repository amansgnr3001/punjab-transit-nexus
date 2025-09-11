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
console.log('🔍 DEBUG: MongoDB URI:', MONGO_URI);

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
			
			// Geocode starting place
			try {
				console.log('Geocoding starting place:', schedule.startingPlace);
				const startGeocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(schedule.startingPlace)}&key=AIzaSyAzttkphjYlfyEbUoe-5NtAVexKsOI7924`;
				console.log('Starting place geocoding URL:', startGeocodingUrl);
				
				const startGeocodingResponse = await fetch(startGeocodingUrl);
				const startGeocodingData = await startGeocodingResponse.json();
				
				console.log('Starting place geocoding response status:', startGeocodingResponse.status);
				console.log('Starting place geocoding data:', JSON.stringify(startGeocodingData, null, 2));
				
				if (startGeocodingData.status === 'OK' && startGeocodingData.results && startGeocodingData.results.length > 0) {
					const startLocation = startGeocodingData.results[0].geometry.location;
					schedule.startLocation.lat = startLocation.lat;
					schedule.startLocation.long = startLocation.lng;
					console.log('✅ Got starting place coordinates:', startLocation.lat, startLocation.lng);
				} else {
					console.log('❌ No geocoding results for starting place:', schedule.startingPlace, 'Status:', startGeocodingData.status);
					console.log('❌ Error message:', startGeocodingData.error_message || 'No error message');
					schedule.startLocation.lat = 0;
					schedule.startLocation.long = 0;
				}
			} catch (startError) {
				console.error('Error geocoding starting place:', schedule.startingPlace, startError);
				schedule.startLocation.lat = 0;
				schedule.startLocation.long = 0;
			}
			
			// Geocode destination
			try {
				console.log('Geocoding destination:', schedule.destination);
				const destGeocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(schedule.destination)}&key=AIzaSyAzttkphjYlfyEbUoe-5NtAVexKsOI7924`;
				console.log('Destination geocoding URL:', destGeocodingUrl);
				
				const destGeocodingResponse = await fetch(destGeocodingUrl);
				const destGeocodingData = await destGeocodingResponse.json();
				
				console.log('Destination geocoding response status:', destGeocodingResponse.status);
				console.log('Destination geocoding data:', JSON.stringify(destGeocodingData, null, 2));
				
				if (destGeocodingData.status === 'OK' && destGeocodingData.results && destGeocodingData.results.length > 0) {
					const destLocation = destGeocodingData.results[0].geometry.location;
					schedule.destinationLocation.lat = destLocation.lat;
					schedule.destinationLocation.long = destLocation.lng;
					console.log('✅ Got destination coordinates:', destLocation.lat, destLocation.lng);
				} else {
					console.log('❌ No geocoding results for destination:', schedule.destination, 'Status:', destGeocodingData.status);
					console.log('❌ Error message:', destGeocodingData.error_message || 'No error message');
					schedule.destinationLocation.lat = 0;
					schedule.destinationLocation.long = 0;
				}
			} catch (destError) {
				console.error('Error geocoding destination:', schedule.destination, destError);
				schedule.destinationLocation.lat = 0;
				schedule.destinationLocation.long = 0;
			}
			
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

// Analytics: Get bus location count
app.get('/api/municipality/bus-location-count', wrap(async (req, res) => {
	try {
		// Initialize map data structure
		const locationCountMap = new Map();
		
		// Retrieve all data from Bus table
		const buses = await Bus.find({});
		
		// Iterate through all buses
		buses.forEach(bus => {
			// Iterate through all schedules
			bus.schedules.forEach(schedule => {
				// Increment starting place
				locationCountMap.set(schedule.startingPlace, (locationCountMap.get(schedule.startingPlace) || 0) + 1);
				
				// Increment destination  
				locationCountMap.set(schedule.destination, (locationCountMap.get(schedule.destination) || 0) + 1);
				
				// Increment all middle stops
				schedule.stops.forEach(stop => {
					locationCountMap.set(stop.name, (locationCountMap.get(stop.name) || 0) + 1);
				});
			});
		});
		res.json(Object.fromEntries(locationCountMap));
	} catch (error) {
		console.error('Error getting bus location count:', error);
		res.status(500).json({ error: 'Failed to get bus location count' });
	}
}));

// Get all schedules of all buses
app.get('/api/municipality/all-schedules', wrap(async (req, res) => {
	try {
		console.log('📅 Fetching all schedules from all buses...');
		
		// Get all buses with their schedules
		const buses = await Bus.find({}, {
			Bus_number_plate: 1,
			busName: 1,
			schedules: 1
		});
		
		// Get all active buses to check which ones are currently active
		const activeBuses = await Tracking.find({}, 'busNumberPlate');
		const activeBusNumbers = new Set(activeBuses.map(bus => bus.busNumberPlate));
		
		console.log(`🚌 Found ${activeBusNumbers.size} active buses:`, Array.from(activeBusNumbers));
		
		// Extract all schedules with bus information and isactive status
		const allSchedules = [];
		
		buses.forEach(bus => {
			bus.schedules.forEach(schedule => {
				// Check if this bus is currently active
				const isActive = activeBusNumbers.has(bus.Bus_number_plate);
				
				allSchedules.push({
					_id: schedule._id,
					busNumberPlate: bus.Bus_number_plate,
					busName: bus.busName,
					starttime: schedule.starttime,
					endtime: schedule.endtime,
					startingPlace: schedule.startingPlace,
					destination: schedule.destination,
					stops: schedule.stops,
					days: schedule.days,
					startLocation: schedule.startLocation,
					destinationLocation: schedule.destinationLocation,
					isactive: isActive
				});
			});
		});
		
		console.log(`📅 Found ${allSchedules.length} schedules across ${buses.length} buses`);
		console.log(`✅ Active schedules: ${allSchedules.filter(s => s.isactive).length}`);
		console.log(`❌ Inactive schedules: ${allSchedules.filter(s => !s.isactive).length}`);
		
		res.json({
			success: true,
			totalSchedules: allSchedules.length,
			totalBuses: buses.length,
			activeSchedules: allSchedules.filter(s => s.isactive).length,
			inactiveSchedules: allSchedules.filter(s => !s.isactive).length,
			schedules: allSchedules
		});
		
	} catch (error) {
		console.error('❌ Error fetching all schedules:', error);
		res.status(500).json({ 
			success: false,
			error: 'Failed to fetch all schedules',
			message: error.message
		});
	}
}));

// Municipality login route
app.post('/api/municipality/login', wrap(async (req, res) => {
	try {
		console.log('🔐 Municipality login attempt:', req.body);
		
		const { name, password } = req.body;
		
		// Validate required fields
		if (!name || !password) {
			return res.status(400).json({
				success: false,
				error: 'Name and password are required'
			});
		}
		
		// Find municipality by name
		const municipality = await User.findOne({ name: name });
		
		if (!municipality) {
			console.log('❌ Municipality not found:', name);
			return res.status(401).json({
				success: false,
				error: 'Invalid credentials'
			});
		}
		
		// Check password (assuming it's hashed)
		const isPasswordValid = await bcrypt.compare(password, municipality.password);
		
		if (!isPasswordValid) {
			console.log('❌ Invalid password for municipality:', name);
			return res.status(401).json({
				success: false,
				error: 'Invalid credentials'
			});
		}
		
		console.log('✅ Municipality login successful:', name);
		
		// Return success response (without sensitive data)
		res.json({
			success: true,
			message: 'Login successful',
			municipality: {
				id: municipality._id,
				name: municipality.name,
				// Don't return password or other sensitive data
			}
		});
		
	} catch (error) {
		console.error('❌ Error during municipality login:', error);
		res.status(500).json({
			success: false,
			error: 'Internal server error during login',
			message: error.message
		});
	}
}));

// Start server
app.listen(PORT, () => {
	console.log(`Municipality server running on port ${PORT}`);
});

module.exports = app;