require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const cors=require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const port = 5000;
app.use(express.json());
app.use(cors());// Allow frontend requests

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Database connection
const connection = mysql.createConnection({
   // host: process.env.DB_HOST,
   // Replace MYSQL_PUBLIC_URL with RAILWAY_PRIVATE_DOMAIN in your database connection
    host: process.env.RAILWAY_PRIVATE_DOMAIN || process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    connectTimeout: 10000, // Timeout set to 10 seconds
});

connection.connect((err) => {
    if (err) {
        console.error('Detailed Database Connection Error:', {
            message: err.message,
            code: err.code,
            errno: err.errno,
            sqlState: err.sqlState,
            fatal: err.fatal
        });
        return;
    }
    console.log('Connected to database successfully');
     // Check current database
     connection.query('SELECT DATABASE() as current_db', (queryErr, results) => {
        if (queryErr) {
            console.error('Database Query Error:', queryErr);
        } else {
            console.log('Current Connected Database:', results[0].current_db);
        }
    });
});


// API Routes - Define these FIRST before static routes
app.post('/api/vehicle/entry', (req, res) => {
    const { vehicleNumber } = req.body;

    // Check if vehicle already exists and hasn't exited
    const checkSQL = 'SELECT * FROM vehicles WHERE vehicle_number = ? AND exit_time IS NULL';
    connection.query(checkSQL, [vehicleNumber], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.length > 0) {
            return res.status(400).json({ error: 'Vehicle already in parking' });
        }

        // Insert new vehicle entry
        const insertSQL = 'INSERT INTO vehicles (vehicle_number, entry_time) VALUES (?, NOW())';
        connection.query(insertSQL, [vehicleNumber], (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ message: 'Vehicle entry recorded successfully' });
        });
    });
});

app.get('/api/vehicle/:vehicleNumber', (req, res) => {
    const { vehicleNumber } = req.params;
    console.log(`1. Searching for vehicle: ${vehicleNumber}`); // Log input

    const sql = 'SELECT * FROM vehicles WHERE vehicle_number = ? ';
    
    connection.query(sql, [vehicleNumber], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        console.log('2. Query result:', results); // Log query results

        if (results.length === 0) {
            console.log('3. Vehicle not found');
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        const vehicle = results[0];
        console.log('4. Vehicle found:', vehicle);
        
        if (vehicle.exit_time) {
            console.log(`5. Vehicle already exited at ${vehicle.exit_time}`);
            return res.status(400).json({ 
                error: `Vehicle already checked out at ${vehicle.exit_time}`, 
                exit_time: vehicle.exit_time 
            });
        }

        console.log('6. Vehicle is still parked');
        res.json(vehicle);
    });
});


// Create payment intent
app.post('/api/create-payment-intent', async (req, res) => {
    try {
        const { amount } = req.body;

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // Convert to cents
            currency: 'aed',
            payment_method_types: ['card'],
        });

        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ error: 'Error creating payment intent' });
    }
});

app.post('/api/vehicle/payment', (req, res) => {
    const { vehicleNumber, amount, paymentIntentId } = req.body;

    const updateSQL = `
        UPDATE vehicles 
        SET exit_time = NOW(),
            payment_status = 'paid',
            amount = ?,
            payment_intent_id = ?
        WHERE vehicle_number = ? 
        AND exit_time IS NULL
    `;

    connection.query(updateSQL, [amount, paymentIntentId, vehicleNumber], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Vehicle not found or already checked out' });
        }

        res.json({ message: 'Payment processed and vehicle checked out successfully' });
    });
});

// Static Routes - Define these AFTER API routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/parking_details', (req, res) => {
    res.sendFile(path.join(__dirname, 'parking_details.html'));
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
