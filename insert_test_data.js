require('dotenv').config();
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

// Current time for entry_time
const now = new Date();
const currentTime = now.toISOString().slice(0, 19).replace('T', ' ');

// Test vehicles data
const testVehicles = [
    {
        vehicle_number: 'ABC123',
        entry_time: currentTime
    },
    {
        vehicle_number: 'XYZ789',
        entry_time: new Date(now - 3 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ') // 3 hours ago
    }
];

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to database');

    // Insert test vehicles
    testVehicles.forEach(vehicle => {
        const query = 'INSERT INTO vehicles (vehicle_number, entry_time) VALUES (?, ?)';
        connection.query(query, [vehicle.vehicle_number, vehicle.entry_time], (err, result) => {
            if (err) {
                console.error('Error inserting vehicle:', err);
            } else {
                console.log(`Added vehicle ${vehicle.vehicle_number}`);
            }
        });
    });

    // Wait a bit to ensure all queries complete
    setTimeout(() => {
        connection.end();
        console.log('\nTest data has been added. You can now test these vehicles:');
        console.log('- ABC123 (just entered)');
        console.log('- XYZ789 (entered 3 hours ago)');
    }, 1000);
});
