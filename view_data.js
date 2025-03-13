require('dotenv').config();
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL successfully\n');

    // Show all vehicles
    connection.query('SELECT * FROM vehicles', (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            return;
        }

        console.log('Current Vehicles in Database:');
        console.log('----------------------------');
        results.forEach(vehicle => {
            console.log(`Vehicle Number: ${vehicle.vehicle_number}`);
            console.log(`Entry Time: ${vehicle.entry_time}`);
            console.log(`Exit Time: ${vehicle.exit_time || 'Not exited'}`);
            console.log(`Payment Status: ${vehicle.payment_status}`);
            console.log(`Amount: ${vehicle.amount || 'Not set'}`);
            console.log('----------------------------');
        });

        connection.end();
    });
});
