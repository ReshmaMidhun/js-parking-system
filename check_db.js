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
    console.log('Connected to MySQL successfully');

    // Check if table exists
    connection.query(`SHOW TABLES LIKE 'vehicles'`, (err, results) => {
        if (err) {
            console.error('Error checking table:', err);
            return;
        }
        console.log('\nTable check results:', results);

        // Get all vehicles
        connection.query('SELECT * FROM vehicles', (err, results) => {
            if (err) {
                console.error('Error getting vehicles:', err);
                return;
            }
            console.log('\nVehicles in database:', results);
            connection.end();
        });
    });
});
