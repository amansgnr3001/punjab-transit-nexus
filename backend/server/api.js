// Minimal Express API for the Real-Time-Bus-Tracking backend
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/realtime-bus-tracking';

// Models (direct imports)
// const Bus = require('../models/bus');
// const Driver = require('../models/driver');
// const User = require('../Models/Municipality'); // Exports User model
const Tracking=require('../Models/activebuses')
// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// DB connection
mongoose.set('strictQuery', false);
mongoose
	.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
	.then(() => console.log('MongoDB connected'))
	.catch((err) => {
		console.error('MongoDB connection error:', err);
		process.exit(1);
	});

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

// Bus Routes
app.get('/api/buses', wrap(async (req, res) => {
	const buses = await Bus.find();
	res.json(buses);
}));

app.post('/api/buses', wrap(async (req, res) => {
	const bus = new Bus(req.body);
	await bus.save();
	res.status(201).json({ message: 'Bus created successfully', bus });
}));

// Driver Routes
app.get('/api/drivers', wrap(async (req, res) => {
	const drivers = await Driver.find().select('-password');
	res.json(drivers);
}));

app.post('/api/drivers', wrap(async (req, res) => {
	await hashPasswordIfPresent(req.body);
	const driver = new Driver(req.body);
	await driver.save();
	res.status(201).json({ message: 'Driver created successfully' });
}));

// User Routes
app.get('/api/users', wrap(async (req, res) => {
	const users = await User.find().select('-password');
	res.json(users);
}));

app.post('/api/users/register', wrap(async (req, res) => {
	await hashPasswordIfPresent(req.body);
	const user = new User(req.body);
	await user.save();
	res.status(201).json({ message: 'User registered successfully' });
}));

// Health check route
app.get('/api/health', (req, res) => {
	res.json({ status: 'OK', message: 'Real-Time Bus Tracking API is running' });
});

// Start server
if (require.main === module) {
	app.listen(PORT, () => {
		console.log(`Server running on port ${PORT}`);
	});
}

module.exports = app;