// Minimal Express API for the Real-Time-Bus-Tracking backend
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const http = require('http');
const { Server } = require('socket.io');
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

	// Handle driver location updates
	socket.on('driver-location-update', (data) => {
		console.log('Driver location update:', data);
		// Broadcast location update to all connected clients
		socket.broadcast.emit('driver-location-updated', data);
	});

	// Handle driver journey start
	socket.on('driver-journey-start', (data) => {
		console.log('Driver journey started:', data);
		// Broadcast journey start to all connected clients
		io.emit('driver-journey-started', data);
	});

	// Handle driver journey end
	socket.on('driver-journey-end', (data) => {
		console.log('Driver journey ended:', data);
		// Broadcast journey end to all connected clients
		io.emit('driver-journey-ended', data);
	});

	// Handle disconnection
	socket.on('disconnect', () => {
		console.log(`Driver disconnected: ${socket.id}`);
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

		// Create new activebuses document
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
			currLat: 0,
			currLong: 0,
			isactive: true
		});

		await newActiveBus.save();

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