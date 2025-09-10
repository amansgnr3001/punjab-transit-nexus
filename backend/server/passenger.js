// Minimal Express API for the Real-Time-Bus-Tracking backend
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();

const PORT = process.env.PORT || 3002;
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

// Search buses by day, starting place, and destination
app.get('/api/passenger/search-buses', wrap(async (req, res) => {
	try {
		const { day, startingPlace, destination } = req.query;
		
		// Validate required parameters
		if (!day || !startingPlace || !destination) {
			return res.status(400).json({
				success: false,
				message: 'Missing required parameters: day, startingPlace, destination'
			});
		}
		
		console.log('Searching buses for:', { day, startingPlace, destination });
		
		// Find buses that have schedules running on the specified day
		const buses = await Bus.find({
			'schedules.days': { $in: [day] }
		});
		
		console.log(`Found ${buses.length} buses running on ${day}`);
		
		// Filter buses that match the route criteria
		const matchingBuses = [];
		
		for (const bus of buses) {
			// Check each schedule of the bus
			for (const schedule of bus.schedules) {
				// Check if this schedule runs on the specified day
				if (schedule.days && schedule.days.includes(day)) {
					let isMatch = false;
					
					console.log(`\n--- Checking bus ${bus.Bus_number_plate} schedule ---`);
					console.log(`Schedule: ${schedule.startingPlace} → ${schedule.destination}`);
					console.log(`Searching: ${startingPlace} → ${destination}`);
					console.log(`Stops:`, schedule.stops?.map(s => s.name) || 'No stops');
					
					// Check if schedule starts at startingPlace and ends at destination
					if (schedule.startingPlace.toLowerCase().includes(startingPlace.toLowerCase()) &&
						schedule.destination.toLowerCase().includes(destination.toLowerCase())) {
						console.log('✅ Match: Direct route (startingPlace → destination)');
						isMatch = true;
					}
					// Check if both places are stops in the correct order
					else if (schedule.stops && schedule.stops.length > 0) {
						const startingPlaceIndex = schedule.stops.findIndex(stop => 
							stop.name.toLowerCase().includes(startingPlace.toLowerCase())
						);
						const destinationIndex = schedule.stops.findIndex(stop => 
							stop.name.toLowerCase().includes(destination.toLowerCase())
						);
						
						console.log(`Starting place "${startingPlace}" found at index: ${startingPlaceIndex}`);
						console.log(`Destination "${destination}" found at index: ${destinationIndex}`);
						
						// Check if both places are found and startingPlace comes before destination
						if (startingPlaceIndex !== -1 && destinationIndex !== -1 && startingPlaceIndex < destinationIndex) {
							console.log('✅ Match: Both places found in stops in correct order');
							isMatch = true;
						}
						// Also check if startingPlace is a stop and destination matches the schedule's destination
						else if (startingPlaceIndex !== -1 && 
								 schedule.destination.toLowerCase().includes(destination.toLowerCase())) {
							console.log('✅ Match: Starting place is a stop and destination matches schedule destination');
							isMatch = true;
						}
						// Also check if startingPlace matches schedule's startingPlace and destination is a stop
						else if (schedule.startingPlace.toLowerCase().includes(startingPlace.toLowerCase()) &&
								 destinationIndex !== -1) {
							console.log('✅ Match: Starting place matches schedule and destination is a stop');
							isMatch = true;
						}
						else {
							console.log('❌ No match: Places not found or wrong order');
						}
					} else {
						console.log('❌ No match: No stops available');
					}
					
					if (isMatch) {
						// Check if bus is active
						const activeBus = await Tracking.findOne({ 
							busNumberPlate: bus.Bus_number_plate,
							isactive: true 
						});
						
						// Add isactive status to bus data
						const busWithStatus = {
							...bus.toObject(),
							schedule: schedule, // Include the matching schedule
							isactive: !!activeBus
						};
						
						matchingBuses.push(busWithStatus);
						break; // Found a matching schedule, no need to check other schedules
					}
				}
			}
		}
		
		console.log(`Found ${matchingBuses.length} matching buses`);
		
		res.status(200).json({
			success: true,
			message: `Found ${matchingBuses.length} buses for the specified route`,
			buses: matchingBuses
		});
		
	} catch (error) {
		console.error('Error searching buses:', error);
		res.status(500).json({
			success: false,
			message: 'Error searching buses',
			error: error.message
		});
	}
}));

// Get all unique places from buses
app.get('/api/passenger/places', wrap(async (req, res) => {
	try {
		console.log('Fetching all unique places from buses...');
		
		// Get all buses
		const buses = await Bus.find({});
		console.log(`Found ${buses.length} buses in database`);
		
		const uniquePlaces = new Set();
		
		// Extract places from schedules
		buses.forEach(bus => {
			if (bus.schedules && bus.schedules.length > 0) {
				bus.schedules.forEach(schedule => {
					// Extract starting places
					if (schedule.startingPlace) {
						uniquePlaces.add(schedule.startingPlace);
					}
					
					// Extract destinations
					if (schedule.destination) {
						uniquePlaces.add(schedule.destination);
					}
					
					// Extract stop names
					if (schedule.stops && schedule.stops.length > 0) {
						schedule.stops.forEach(stop => {
							if (stop.name) {
								uniquePlaces.add(stop.name);
							}
						});
					}
				});
			}
		});
		
		// Convert Set to Array and sort
		const placesList = Array.from(uniquePlaces).sort();
		
		console.log(`Found ${placesList.length} unique places:`, placesList);
		
		res.status(200).json({
			success: true,
			message: `Found ${placesList.length} unique places`,
			places: placesList
		});
		
	} catch (error) {
		console.error('Error fetching places:', error);
		res.status(500).json({
			success: false,
			message: 'Error fetching places',
			error: error.message
		});
	}
}));

// Get specific schedule from a bus
app.get('/api/passenger/bus/:busnumberplate/schedule/:scheduleId', wrap(async (req, res) => {
	try {
		const { busnumberplate, scheduleId } = req.params;
		
		console.log(`Fetching schedule ${scheduleId} for bus ${busnumberplate}`);
		
		// Find the bus by busnumberplate
		const bus = await Bus.findOne({ Bus_number_plate: busnumberplate });
		
		if (!bus) {
			return res.status(404).json({
				success: false,
				message: `Bus with number plate ${busnumberplate} not found`
			});
		}
		
		console.log(`Found bus: ${bus.busName} (${bus.Bus_number_plate})`);
		
		// Find the specific schedule by ID
		const schedule = bus.schedules.find(s => s._id.toString() === scheduleId);
		
		if (!schedule) {
			return res.status(404).json({
				success: false,
				message: `Schedule with ID ${scheduleId} not found in bus ${busnumberplate}`
			});
		}
		
		console.log(`Found schedule: ${schedule.startingPlace} → ${schedule.destination}`);
		
		res.status(200).json({
			success: true,
			message: 'Schedule retrieved successfully',
			schedule: schedule
		});
		
	} catch (error) {
		console.error('Error fetching schedule:', error);
		res.status(500).json({
			success: false,
			message: 'Error fetching schedule',
			error: error.message
		});
	}
}));

// Start server
app.listen(PORT, () => {
	console.log(`Passenger server running on port ${PORT}`);
});

module.exports = app;