// Minimal Express API for the Real-Time-Bus-Tracking backend
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const http = require('http');
const { Server } = require('socket.io');
const fetch = require('node-fetch');
const { decode } = require('@googlemaps/polyline-codec');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/realtime-bus-tracking';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Models (direct imports)
const Bus = require('../models/Bus');
const Driver = require('../models/Driver');
const User = require('../models/Municipality');
const Tracking = require('../models/activebuses');
const Emergency = require('../models/Emergency');

// Helper function to find closest point on route
function findClosestPointOnRoute(location, routePoints) {
	let closestPoint = routePoints[0];
	let closestDistance = getDistance(location, routePoints[0]);
	
	for (let i = 1; i < routePoints.length; i++) {
		const distance = getDistance(location, routePoints[i]);
		if (distance < closestDistance) {
			closestDistance = distance;
			closestPoint = routePoints[i];
		}
	}
	
	return closestPoint;
}

// Helper function to calculate distance between two points
function getDistance(point1, point2) {
	const R = 6371e3; // Earth's radius in meters
	const φ1 = point1.lat * Math.PI/180;
	const φ2 = point2.lat * Math.PI/180;
	const Δφ = (point2.lat - point1.lat) * Math.PI/180;
	const Δλ = (point2.lng - point1.lng) * Math.PI/180;

	const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
		Math.cos(φ1) * Math.cos(φ2) *
		Math.sin(Δλ/2) * Math.sin(Δλ/2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

	return R * c; // Distance in meters
}

// Helper function to find position index on route
function findPositionIndexOnRoute(location, routePoints) {
	let closestIndex = 0;
	let closestDistance = getDistance(location, routePoints[0]);
	
	for (let i = 1; i < routePoints.length; i++) {
		const distance = getDistance(location, routePoints[i]);
		if (distance < closestDistance) {
			closestDistance = distance;
			closestIndex = i;
		}
	}
	
	return closestIndex;
}

// Helper function to check if bus has crossed a station
function hasBusCrossedStation(busPositionIndex, stationPositionIndex) {
	return busPositionIndex > stationPositionIndex;
}

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

// Socket.IO configuration
const io = new Server(server, {
	cors: {
		origin: [
			'http://localhost:8080', 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002',
			'http://127.0.0.1:8080', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001', 'http://127.0.0.1:3002'
		],
		methods: ['GET', 'POST'],
		credentials: true
	}
});

// Socket.IO connection handling
io.on('connection', (socket) => {
	console.log(`Driver connected: ${socket.id}`);

	// Broadcast event for drivers
	socket.on('broadcast', async (data) => {
		try {
			const { lat, long, busnumberplate } = data;
			
			console.log('=== BROADCAST EVENT RECEIVED ===');
			console.log('Location data:', { lat, long, busnumberplate });
			
			// Validate required data
			if (!lat || !long || !busnumberplate) {
				console.log('❌ Missing required fields');
				socket.emit('error', { message: 'Missing required fields: lat, long, busnumberplate' });
				return;
			}

			// Retrieve document from activebuses schema
			const activeBusDoc = await Tracking.findOne({ busNumberPlate: busnumberplate });
			if (!activeBusDoc) {
				console.log('❌ Active bus not found:', busnumberplate);
				socket.emit('error', { message: 'Active bus not found with the provided bus number plate' });
				return;
			}
			console.log('✅ Active bus found:', activeBusDoc.busName);

			// Reverse geocoding to get current address
			const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${long}&key=AIzaSyAzttkphjYlfyEbUoe-5NtAVexKsOI7924`;
			console.log('🌍 Geocoding URL:', geocodingUrl);
			
			const geocodingResponse = await fetch(geocodingUrl);
			const geocodingData = await geocodingResponse.json();
			
			console.log('🌍 Geocoding Response Status:', geocodingResponse.status);
			console.log('🌍 Geocoding Data:', JSON.stringify(geocodingData, null, 2));
			
			let curr_address = '';
			if (geocodingData.status === 'OK' && geocodingData.results && geocodingData.results.length > 0) {
				curr_address = geocodingData.results[0].formatted_address;
				console.log('✅ Geocoding successful:', curr_address);
			} else {
				console.log('❌ Geocoding failed:', geocodingData.status, geocodingData.error_message);
				socket.emit('error', { message: 'Failed to get current address from coordinates' });
				return;
			}

			// Prepare waypoints from middle stations
			const waypoints = activeBusDoc.middlestations.map(station => station.name).join('|');
			console.log('🗺️ Waypoints:', waypoints);
			
			// Get directions from current location to destination via waypoints
			const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${lat},${long}&destination=${encodeURIComponent(activeBusDoc.destination)}&waypoints=${encodeURIComponent(waypoints)}&key=AIzaSyAzttkphjYlfyEbUoe-5NtAVexKsOI7924`;
			console.log('🗺️ Directions URL:', directionsUrl);
			
			const directionsResponse = await fetch(directionsUrl);
			const directionsData = await directionsResponse.json();

			console.log('🗺️ Directions Response Status:', directionsResponse.status);
			console.log('🗺️ Directions Data:', JSON.stringify(directionsData, null, 2));

			if (directionsData.status !== 'OK' || !directionsData.routes || directionsData.routes.length === 0) {
				console.log('❌ Directions failed:', directionsData.status, directionsData.error_message);
				socket.emit('error', { message: 'Failed to get directions' });
				return;
			}
			console.log('✅ Directions successful');

			// Get current time in 12-hour format (e.g., "2:30 PM")
			const curr_time = new Date().toLocaleTimeString('en-US', {
				hour: 'numeric',
				minute: '2-digit',
				hour12: true
			});

			// Extract polyline first
			const polyline = directionsData.routes[0].overview_polyline.points;
			console.log('🗺️ Polyline extracted:', polyline ? 'SUCCESS' : 'FAILED');
			console.log('🗺️ Polyline length:', polyline ? polyline.length : 0);

			// Process legs and update timing data
			const legs = directionsData.routes[0].legs;
			
			// Update middle stations timing with flag optimization
			const routePoints = decode(polyline);
			const busLocation = { lat: lat, lng: long };
			const busPositionIndex = findPositionIndexOnRoute(busLocation, routePoints);
			
			let x = 0; // Flag variable
			let currentTime = new Date();
			
			for (let i = 0; i < legs.length - 1; i++) {
				if (activeBusDoc.middlestations[i]) {
					if (x === 0) {
						// Check if bus has crossed this station
						const stationLocation = { 
							lat: activeBusDoc.middlestations[i].lat, 
							lng: activeBusDoc.middlestations[i].long 
						};
						const stationPositionIndex = findPositionIndexOnRoute(stationLocation, routePoints);
						
						if (hasBusCrossedStation(busPositionIndex, stationPositionIndex)) {
							continue; // Skip ETA calculation for crossed stations
						} else {
							x = 1; // Set flag, bus hasn't crossed this station yet
						}
					}
					// If x === 1, just calculate ETA (don't check if crossed)
					
					// Calculate actual arrival time based on current time
					const arrivalTime = new Date(currentTime.getTime() + (legs[i].duration.value * 1000));
					const arrivalTimeString = arrivalTime.toLocaleTimeString('en-US', {
						hour: 'numeric',
						minute: '2-digit',
						hour12: true
					});
					activeBusDoc.middlestations[i].time = arrivalTimeString;
					
					// Update current time to this station's arrival time for next calculation
					currentTime = arrivalTime;
				}
			}

			// Update endtime with destination arrival time
			if (legs.length > 0) {
				// Calculate destination arrival time based on current time + last leg duration
				const destinationArrivalTime = new Date(currentTime.getTime() + (legs[legs.length - 1].duration.value * 1000));
				const destinationArrivalTimeString = destinationArrivalTime.toLocaleTimeString('en-US', {
					hour: 'numeric',
					minute: '2-digit',
					hour12: true
				});
				activeBusDoc.endtime = destinationArrivalTimeString;
			}

		// Update current address
		console.log('🔄 Before update - currLat:', activeBusDoc.currLat, 'currLong:', activeBusDoc.currLong);
		activeBusDoc.address = curr_address;
		activeBusDoc.currLat = lat;
		activeBusDoc.currLong = long;
		console.log('🔄 After update - currLat:', activeBusDoc.currLat, 'currLong:', activeBusDoc.currLong);

			console.log('📍 Updating location:', {
				address: curr_address,
				currLat: lat,
				currLong: long
			});

			// Save updated document
		console.log('💾 Saving document to database...');
		await activeBusDoc.save();
		console.log('✅ Document saved successfully');
		
		// Verify the saved document
		const savedDoc = await Tracking.findOne({ busNumberPlate: busnumberplate });
		console.log('🔍 Verification - Saved document currLat:', savedDoc.currLat);
		console.log('🔍 Verification - Saved document currLong:', savedDoc.currLong);
		console.log('🔍 Verification - Saved document address:', savedDoc.address);

			// Send response with updated document and polyline to all clients in the bus room
			console.log('📡 Broadcasting to room:', busnumberplate);
			console.log('📡 Room members count:', io.sockets.adapter.rooms.get(busnumberplate)?.size || 0);
			console.log('📡 Broadcast data - activeBus:', activeBusDoc ? 'EXISTS' : 'MISSING');
			console.log('📡 Broadcast data - polyline:', polyline ? 'EXISTS' : 'MISSING');
			io.to(busnumberplate).emit('broadcast_response', {
				success: true,
				activeBus: activeBusDoc,
				polyline: polyline
			});
			console.log('✅ Broadcast sent successfully to room:', busnumberplate);

		} catch (error) {
			console.error('Broadcast error:', error);
			socket.emit('error', { message: 'Internal server error during broadcast' });
		}
	});

	// Businfo event for passengers
	socket.on('businfo', async (data) => {
		try {
			const { busnumberplate } = data;
			
			console.log('=== BUSINFO EVENT RECEIVED ===');
			console.log('Bus number plate:', busnumberplate);
			
			// Validate required data
			if (!busnumberplate) {
				console.log('❌ Missing busnumberplate');
				socket.emit('businfo_response', {
					success: false,
					message: 'Missing required field: busnumberplate'
				});
				return;
			}

			// Retrieve document from activebuses schema
			console.log('🔍 Checking bus status in database...');
			const activeBusDoc = await Tracking.findOne({ busNumberPlate: busnumberplate });
			
			if (!activeBusDoc) {
				console.log('❌ Bus not found in database:', busnumberplate);
				socket.emit('businfo_response', {
					success: false,
					message: 'Bus not found'
				});
				return;
			}
			
			console.log('✅ Bus found in database:', activeBusDoc.busName);
			console.log('🔍 Bus active status:', activeBusDoc.isactive);
			
			// Check isactive field
			if (activeBusDoc.isactive === false) {
				console.log('❌ Bus already reached destination');
				socket.emit('businfo_response', {
					success: false,
					message: 'Bus already reached destination'
				});
				socket.disconnect();
				return;
			}
			
			// If isactive is true, allow passenger to join room
			console.log('✅ Bus is active, allowing passenger to join room');
			socket.join(busnumberplate);
			console.log(`✅ Socket joined room: ${busnumberplate}`);
			
			// Send confirmation response
			socket.emit('businfo_response', {
				success: true,
				message: `Successfully joined room for bus ${busnumberplate}`,
				room: busnumberplate
			});
			
		} catch (error) {
			console.error('Error in businfo event:', error);
			socket.emit('businfo_response', {
				success: false,
				message: 'Error checking bus status'
			});
		}
	});

	// SOS_info event for emergency situations
	socket.on('SOS_info', async (data) => {
		try {
			const { driverId, busNumberPlate, latitude, longitude, timestamp } = data;
			
			console.log('=== SOS_INFO EVENT RECEIVED ===');
			console.log('Driver ID:', driverId);
			console.log('Bus number plate:', busNumberPlate);
			console.log('Location:', latitude, longitude);
			console.log('Timestamp:', timestamp);
			
			// Validate required data
			if (!driverId || !busNumberPlate || !latitude || !longitude) {
				console.log('❌ Missing required fields in SOS_info');
				socket.emit('sos_response', {
					success: false,
					message: 'Missing required fields: driverId, busNumberPlate, latitude, longitude'
				});
				return;
			}

			// Join emergency room
			socket.join('emergency');
			console.log('🚨 Driver joined emergency room');

			// Retrieve document from activebuses collection
			console.log('🔍 Retrieving bus document for emergency...');
			const activeBusDoc = await Tracking.findOne({ busNumberPlate: busNumberPlate });

			if (!activeBusDoc) {
				console.log('❌ Bus not found in activebuses collection');
				socket.emit('sos_response', {
					success: false,
					message: 'Bus not found in active buses'
				});
				return;
			}

			// Store original destination before updating
			const originalDestination = activeBusDoc.destination;
			const startingPlace = activeBusDoc.startingPlace;

			console.log('📋 Original destination:', originalDestination);
			console.log('📋 Starting place:', startingPlace);

			// Update the document - set destination to "stuck"
			activeBusDoc.destination = 'stuck';
			await activeBusDoc.save();

			console.log('✅ Bus document updated - destination set to "stuck"');

			// Save emergency data to database
			console.log('💾 Saving emergency data to database...');
			const emergencyData = new Emergency({
				driverId: driverId,
				busNumberPlate: busNumberPlate,
				latitude: latitude,
				longitude: longitude,
				timestamp: timestamp ? new Date(timestamp) : new Date()
			});
			
			await emergencyData.save();
			console.log('✅ Emergency data saved to database');

			// Broadcast emergency message to emergency room
			const emergencyMessage = {
				type: 'EMERGENCY',
				message: '🚨 EMERGENCY ALERT! Bus is stuck and requires immediate assistance!',
				busNumberPlate: busNumberPlate,
				startingPlace: startingPlace,
				originalDestination: originalDestination,
				currentDestination: 'stuck',
				timestamp: new Date().toISOString(),
				driverId: activeBusDoc.driverId,
				driverName: activeBusDoc.driverName
			};

			// Broadcast to emergency room
			io.to('emergency').emit('emergency_alert', emergencyMessage);
			console.log('🚨 Emergency alert broadcasted to emergency room');

			// Send response back to the driver
			socket.emit('sos_response', {
				success: true,
				message: 'Emergency alert sent successfully',
				emergencyMessage: emergencyMessage
			});

		} catch (error) {
			console.error('❌ Error in SOS_info event:', error);
			socket.emit('sos_response', {
				success: false,
				message: 'Error processing emergency alert'
			});
		}
	});

	// Subscribe to emergency room
	socket.on('subscribe_emergency', (data) => {
		try {
			console.log('=== SUBSCRIBE_EMERGENCY EVENT RECEIVED ===');
			console.log('Socket ID:', socket.id);
			
			// Join emergency room
			socket.join('emergency');
			console.log('🚨 Socket joined emergency room:', socket.id);
			
			// Send confirmation back to client
			socket.emit('emergency_subscribed', {
				success: true,
				message: 'Successfully subscribed to emergency notifications',
				room: 'emergency',
				timestamp: new Date().toISOString()
			});
			
		} catch (error) {
			console.error('❌ Error in subscribe_emergency event:', error);
			socket.emit('emergency_subscribed', {
				success: false,
				message: 'Failed to subscribe to emergency notifications'
			});
		}
	});

	// Handle disconnection
	socket.on('disconnect', () => {
		console.log(`Driver disconnected: ${socket.id}`);
		
		// Clean up location interval if it exists
		if (socket.locationInterval) {
			clearInterval(socket.locationInterval);
			socket.locationInterval = null;
			console.log(`Location interval cleared for disconnected driver ${socket.id}`);
		}
	});
});

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

// Driver Registration
app.post('/api/driver/register', wrap(async (req, res) => {
	try {
		const { name, age, contactNumber, password } = req.body;

		// Validate required fields
		if (!name || !age || !contactNumber || !password) {
			return res.status(400).json({
				success: false,
				message: 'All fields are required'
			});
		}

		// Check if driver already exists
		const existingDriver = await Driver.findOne({ contactNumber });
		if (existingDriver) {
			return res.status(400).json({
				success: false,
				message: 'Driver with this contact number already exists'
			});
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(password, 10);

		// Create new driver
		const newDriver = new Driver({
			name,
			age,
			contactNumber,
			password: hashedPassword
		});

		await newDriver.save();

		// Generate JWT token
		const token = jwt.sign(
			{ 
				driverId: newDriver._id,
				contactNumber: newDriver.contactNumber
			},
			JWT_SECRET,
			{ expiresIn: '24h' }
		);

		res.status(201).json({
			success: true,
			message: 'Driver registered successfully',
			token,
			driver: {
				id: newDriver._id,
				name: newDriver.name,
				age: newDriver.age,
				contactNumber: newDriver.contactNumber
			}
		});

	} catch (error) {
		console.error('Registration error:', error);
		res.status(500).json({
			success: false,
			message: 'Internal server error during registration'
		});
	}
}));

// Driver Login
app.post('/api/driver/login', wrap(async (req, res) => {
	try {
		const { contactNumber, password } = req.body;

		// Validate required fields
		if (!contactNumber || !password) {
			return res.status(400).json({
				success: false,
				message: 'Contact number and password are required'
			});
		}

		// Find driver by contact number
		const driver = await Driver.findOne({ contactNumber });
		if (!driver) {
			return res.status(401).json({
				success: false,
				message: 'Invalid credentials'
			});
		}

		// Check password
		const isPasswordValid = await bcrypt.compare(password, driver.password);
		if (!isPasswordValid) {
			return res.status(401).json({
				success: false,
				message: 'Invalid credentials'
			});
		}

		// Generate JWT token
		const token = jwt.sign(
			{ 
				driverId: driver._id,
				contactNumber: driver.contactNumber
			},
			JWT_SECRET,
			{ expiresIn: '24h' }
		);

		res.status(200).json({
			success: true,
			message: 'Login successful',
			token,
			driver: {
				id: driver._id,
				name: driver.name,
				age: driver.age,
				contactNumber: driver.contactNumber
			}
		});

	} catch (error) {
		console.error('Login error:', error);
		res.status(500).json({
			success: false,
			message: 'Internal server error during login'
		});
	}
}));

// Get driver profile (protected route)
app.get('/api/driver/profile', wrap(async (req, res) => {
	try {
		const token = req.header('Authorization')?.replace('Bearer ', '');
		
		if (!token) {
			return res.status(401).json({
				success: false,
				message: 'Access token required'
			});
		}

		const decoded = jwt.verify(token, JWT_SECRET);
		const driver = await Driver.findById(decoded.driverId).select('-password');

		if (!driver) {
			return res.status(404).json({
				success: false,
				message: 'Driver not found'
			});
		}

		res.status(200).json({
			success: true,
			driver
		});

	} catch (error) {
		console.error('Profile error:', error);
		res.status(401).json({
			success: false,
			message: 'Invalid or expired token'
		});
	}
}));

// Start Journey Route
app.post('/api/driver/start-journey', wrap(async (req, res) => {
	try {
		const { driverName, driverId, busNumber, startingPlace, destination } = req.body;
		
		// Validate required fields
		if (!driverName || !driverId || !busNumber || !startingPlace || !destination) {
			return res.status(400).json({ 
				success: false, 
				message: 'Missing required fields: driverName, driverId, busNumber, startingPlace, destination' 
			});
		}

		// Find the bus document using busNumber
		const bus = await Bus.findOne({ Bus_number_plate: busNumber });
		if (!bus) {
			return res.status(404).json({ 
				success: false, 
				message: 'Bus not found with the provided bus number' 
			});
		}

		// Find matching schedule from the bus's schedules array
		const matchingSchedule = bus.schedules.find(schedule => 
			schedule.startingPlace === startingPlace && 
			schedule.destination === destination
		);

		if (!matchingSchedule) {
			return res.status(404).json({ 
				success: false, 
				message: 'No matching schedule found for the provided starting place and destination' 
			});
		}

		// Debug: Log the matching schedule to see if endtime exists
		console.log('Matching schedule found:', JSON.stringify(matchingSchedule, null, 2));
		console.log('Endtime from schedule:', matchingSchedule.endtime);

		// Create new activebuses document
		console.log('Creating new activebuses document...');
		console.log('Database name:', mongoose.connection.db.databaseName);
		
		const newActiveBus = new Tracking({
			driverName,
			driverId,
			busNumberPlate: bus.Bus_number_plate,
			busName: bus.busName,
			middlestations: matchingSchedule.stops.map(stop => ({
				name: stop.name,
				lat: stop.lat,
				long: stop.long,
				time: stop.time
			})),
			startingPlace,
			destination,
			startingPlaceLocation: {
				lat: matchingSchedule.startLocation.lat,
				long: matchingSchedule.startLocation.long
			},
			destinationLocation: {
				lat: matchingSchedule.destinationLocation.lat,
				long: matchingSchedule.destinationLocation.long
			},
			address: startingPlace, // Set address equal to startingPlace
			currLat: 0,
			currLong: 0,
			isactive: true
		});

		// Explicitly set endtime after document creation
		newActiveBus.endtime = matchingSchedule.endtime;

		console.log('Document to save:', JSON.stringify(newActiveBus, null, 2));
		console.log('Endtime in newActiveBus:', newActiveBus.endtime);
		console.log('Endtime type:', typeof newActiveBus.endtime);
		console.log('Endtime value:', newActiveBus.endtime);
		
		try {
			await newActiveBus.save();
			console.log('Document saved successfully!');
			console.log('Saved document endtime:', newActiveBus.endtime);
			console.log('Full saved document:', JSON.stringify(newActiveBus, null, 2));
		} catch (saveError) {
			console.error('Error saving document:', saveError);
			throw saveError;
		}

		res.status(201).json({
			success: true,
			message: 'Journey started successfully',
			activeBus: {
				id: newActiveBus._id,
				driverName: newActiveBus.driverName,
				driverId: newActiveBus.driverId,
				busNumberPlate: newActiveBus.busNumberPlate,
				busName: newActiveBus.busName,
				startingPlace: newActiveBus.startingPlace,
				destination: newActiveBus.destination,
				address: newActiveBus.address,
				endtime: newActiveBus.endtime,
				isactive: newActiveBus.isactive
			}
		});

	} catch (error) {
		console.error('Error starting journey:', error);
		res.status(500).json({ 
			success: false, 
			message: 'Internal server error while starting journey' 
		});
	}
}));

// Deactivate Bus Route
app.post('/api/driver/deactivate-bus/:busNumberPlate', wrap(async (req, res) => {
	try {
		const { busNumberPlate } = req.params;
		
		// Validate required parameter
		if (!busNumberPlate) {
			return res.status(400).json({ 
				success: false, 
				message: 'Missing required parameter: busNumberPlate' 
			});
		}

		// Find the bus document in activebuses schema
		const activeBusDoc = await Tracking.findOne({ busNumberPlate: busNumberPlate });
		if (!activeBusDoc) {
			return res.status(404).json({ 
				success: false, 
				message: 'Bus not found in active buses with the provided bus number plate' 
			});
		}

		// Update isactive field from true to false
		activeBusDoc.isactive = false;
		await activeBusDoc.save();

		console.log(`Bus ${busNumberPlate} deactivated successfully`);

		res.status(200).json({
			success: true,
			message: 'Bus deactivated successfully',
			bus: {
				busNumberPlate: activeBusDoc.busNumberPlate,
				busName: activeBusDoc.busName,
				driverName: activeBusDoc.driverName,
				isactive: activeBusDoc.isactive
			}
		});

	} catch (error) {
		console.error('Error deactivating bus:', error);
		res.status(500).json({ 
			success: false, 
			message: 'Internal server error while deactivating bus' 
		});
	}
}));

// Get Bus Routes (Starting Places and Destinations)
app.get('/api/driver/bus-routes', wrap(async (req, res) => {
	try {
		const { busNumberPlate } = req.query;
		
		// Validate required parameter
		if (!busNumberPlate) {
			return res.status(400).json({ 
				success: false, 
				message: 'Missing required parameter: busNumberPlate' 
			});
		}

		// Find the bus document using busNumberPlate
		const bus = await Bus.findOne({ Bus_number_plate: busNumberPlate });
		if (!bus) {
			return res.status(404).json({ 
				success: false, 
				message: 'Bus not found with the provided bus number plate' 
			});
		}

		// Extract all starting places and destinations from schedules
		const startingPlaces = [...new Set(bus.schedules.map(schedule => schedule.startingPlace))];
		const destinations = [...new Set(bus.schedules.map(schedule => schedule.destination))];

		res.status(200).json({
			success: true,
			message: 'Bus routes retrieved successfully',
			busNumberPlate: bus.Bus_number_plate,
			busName: bus.busName,
			startingPlaces,
			destinations
		});

	} catch (error) {
		console.error('Error getting bus routes:', error);
		res.status(500).json({ 
			success: false, 
			message: 'Internal server error while retrieving bus routes' 
		});
	}
}));

// Start server
server.listen(PORT, () => {
	console.log(`Driver server with Socket.IO running on port ${PORT}`);
});

module.exports = { app, io };