require('dotenv').config();
const mysql = require('mysql2');

// Connect to the original parking_system database
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'parking_system'  // Using the original database name
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL successfully');

    // Create parking_data table with original structure
    const createTableSQL = `
        CREATE TABLE IF NOT EXISTS parking_data (
            id INT AUTO_INCREMENT PRIMARY KEY,
            vehicle_number VARCHAR(20) NOT NULL,
            entry_time DATETIME NOT NULL,
            paid BOOLEAN DEFAULT FALSE
        )
    `;

    connection.query(createTableSQL, (err) => {
        if (err) {
            console.error('Error creating parking_data table:', err);
            return;
        }
        console.log('parking_data table recreated successfully in parking_system database');
        connection.end();
    });
});
