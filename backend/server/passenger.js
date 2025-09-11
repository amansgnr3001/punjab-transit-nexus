// Minimal Express API for the Real-Time-Bus-Tracking backend
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();

const PORT = process.env.PORT || 3002;
const MONGO_URI =  'mongodb://127.0.0.1:27017/realtime-bus-tracking';

// Models (direct imports)
const Bus = require('../models/Bus');
const Driver = require('../models/Driver');
const User = require('../models/Municipality');
const Tracking = require('../models/activebuses');
const Complaint = require('../models/Complaint');
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

// Submit complaint
app.post('/api/passenger/complaint', wrap(async (req, res) => {
	try {
		console.log('📝 Complaint submission received:', req.body);
		
		const { busnumberplate, startingplace, destination, description } = req.body;
		
		// Validate required fields
		if (!busnumberplate || !startingplace || !destination || !description) {
			return res.status(400).json({
				success: false,
				error: 'All fields are required: busnumberplate, startingplace, destination, description'
			});
		}
		
		// Create new complaint document
		const complaint = new Complaint({
			busnumberplate: busnumberplate.trim(),
			startingplace: startingplace.trim(),
			destination: destination.trim(),
			description: description.trim()
		});
		
		// Save to database
		await complaint.save();
		
		console.log('✅ Complaint saved successfully:', complaint._id);
		
		res.json({
			success: true,
			message: 'Complaint submitted successfully',
			complaintId: complaint._id,
			complaint: {
				_id: complaint._id,
				busnumberplate: complaint.busnumberplate,
				startingplace: complaint.startingplace,
				destination: complaint.destination,
				description: complaint.description,
				createdAt: complaint.createdAt
			}
		});
		
	} catch (error) {
		console.error('❌ Error submitting complaint:', error);
		res.status(500).json({
			success: false,
			error: 'Failed to submit complaint',
			message: error.message
		});
	}
}));

// Get all bus number plates
app.get('/api/passenger/bus-number-plates', wrap(async (req, res) => {
	try {
		console.log('🚌 Fetching all bus number plates...');
		
		// Get all buses and extract only the bus number plates
		const buses = await Bus.find({}, 'Bus_number_plate');
		
		// Extract bus number plates from the results
		const busNumberPlates = buses.map(bus => bus.Bus_number_plate);
		
		console.log(`✅ Found ${busNumberPlates.length} bus number plates:`, busNumberPlates);
		
		res.json({
			success: true,
			totalBuses: busNumberPlates.length,
			busNumberPlates: busNumberPlates
		});
		
	} catch (error) {
		console.error('❌ Error fetching bus number plates:', error);
		res.status(500).json({
			success: false,
			error: 'Failed to fetch bus number plates',
			message: error.message
		});
	}
}));

// Get unique places for a specific bus
app.get('/api/passenger/bus/:busnumberplate/places', wrap(async (req, res) => {
	try {
		const { busnumberplate } = req.params;
		
		console.log('🚌 Fetching unique places for bus:', busnumberplate);
		
		// Find the bus with the given number plate
		const bus = await Bus.findOne({ Bus_number_plate: busnumberplate });
		
		if (!bus) {
			return res.status(404).json({
				success: false,
				error: 'Bus not found',
				message: `No bus found with number plate: ${busnumberplate}`
			});
		}
		
		// Set to store unique places
		const uniquePlaces = new Set();
		
		// Traverse each schedule of the bus
		bus.schedules.forEach(schedule => {
			// Add starting place
			if (schedule.startingPlace) {
				uniquePlaces.add(schedule.startingPlace);
			}
			
			// Add destination
			if (schedule.destination) {
				uniquePlaces.add(schedule.destination);
			}
			
			// Add all stops
			if (schedule.stops && Array.isArray(schedule.stops)) {
				schedule.stops.forEach(stop => {
					if (stop.name) {
						uniquePlaces.add(stop.name);
					}
				});
			}
		});
		
		// Convert Set to Array and sort alphabetically
		const placesArray = Array.from(uniquePlaces).sort();
		
		console.log(`✅ Found ${placesArray.length} unique places for bus ${busnumberplate}:`, placesArray);
		
		res.json({
			success: true,
			busNumberPlate: busnumberplate,
			busName: bus.busName,
			totalPlaces: placesArray.length,
			places: placesArray
		});
		
	} catch (error) {
		console.error('❌ Error fetching unique places for bus:', error);
		res.status(500).json({
			success: false,
			error: 'Failed to fetch unique places for bus',
			message: error.message
		});
	}
}));

// Route to insert your actual bus data
app.post('/api/passenger/insert-actual-data', wrap(async (req, res) => {
	try {
		console.log('🚌 Inserting actual bus data...');
		
		// Clear existing data
		await Bus.deleteMany({});
		console.log('🗑️ Cleared existing bus data');
		
		// Insert your actual bus data
		const actualBusData = {
			Bus_number_plate: '1234',
			busName: 'Rana',
			schedules: [
				{
					starttime: '16:00',
					endtime: '17:30',
					startingPlace: 'RRU gandhinagar',
					destination: 'Infocity gandhinagar',
					startLocation: { lat: 23.1544551, long: 72.8849844 },
					destinationLocation: { lat: 23.1935088, long: 72.63459139999999 },
					stops: [
						{
							name: 'Dahegam',
							lat: 23.1637196,
							long: 72.81024500000001,
							time: 1198
						},
						{
							name: 'kudasan',
							lat: 23.179589,
							long: 72.63474599999999,
							time: 3268
						}
					],
					days: ['monday', 'saturday']
				},
				{
					starttime: '10:30',
					endtime: '13:00',
					startingPlace: 'RRU gandhinagar',
					destination: 'Infocity Gandhinagar',
					startLocation: { lat: 23.1544551, long: 72.8849844 },
					destinationLocation: { lat: 23.1935088, long: 72.63459139999999 },
					stops: [
						{
							name: 'Dahegam',
							lat: 23.1637196,
							long: 72.81024500000001,
							time: 1198
						},
						{
							name: 'Kudasan',
							lat: 23.179589,
							long: 72.63474599999999,
							time: 3268
						}
					],
					days: ['Monday', 'Saturday']
				}
			]
		};
		
		const newBus = new Bus(actualBusData);
		await newBus.save();
		
		console.log('✅ Actual bus data inserted successfully');
		
		res.json({
			success: true,
			message: 'Actual bus data inserted successfully',
			bus: newBus
		});
		
	} catch (error) {
		console.error('❌ Error inserting actual bus data:', error);
		res.status(500).json({
			success: false,
			error: 'Failed to insert actual bus data',
			message: error.message
		});
	}
}));

// Debug route to check collections
app.get('/api/passenger/debug-collections', wrap(async (req, res) => {
	try {
		console.log('🔍 Debugging collections...');
		
		// Get all collections
		const collections = await mongoose.connection.db.listCollections().toArray();
		console.log('📁 Available collections:', collections.map(c => c.name));
		
		// Check buses collection
		const busesCount = await mongoose.connection.db.collection('buses').countDocuments();
		console.log('🚌 Buses collection count:', busesCount);
		
		// Check Bus collection (uppercase)
		const BusCount = await mongoose.connection.db.collection('Bus').countDocuments();
		console.log('🚌 Bus collection count:', BusCount);
		
		// Get sample from buses collection
		const sampleBuses = await mongoose.connection.db.collection('buses').find({}).limit(2).toArray();
		console.log('📋 Sample from buses collection:', sampleBuses);
		
		res.json({
			success: true,
			collections: collections.map(c => c.name),
			busesCount,
			BusCount,
			sampleBuses
		});
		
	} catch (error) {
		console.error('❌ Error debugging collections:', error);
		res.status(500).json({
			success: false,
			error: 'Failed to debug collections',
			message: error.message
		});
	}
}));

// Get all schedules of all buses
app.get('/api/passenger/all-schedules', wrap(async (req, res) => {
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

// Start server
app.listen(PORT, () => {
	console.log(`Passenger server running on port ${PORT}`);
});

module.exports = app;