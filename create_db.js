require('dotenv').config();
const mysql = require('mysql2');

// First connection to MySQL without database
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL successfully');

    // Create new database if it doesn't exist
    connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`, (err) => {
        if (err) {
            console.error('Error creating database:', err);
            return;
        }
        console.log(`Database ${process.env.DB_NAME} created successfully`);

        // Switch to the new database
        connection.query(`USE ${process.env.DB_NAME}`, (err) => {
            if (err) {
                console.error('Error switching database:', err);
                return;
            }
            console.log(`Switched to database ${process.env.DB_NAME}`);

            // Create vehicles table with payment_intent_id column
            const createTableSQL = `
                CREATE TABLE IF NOT EXISTS vehicles (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    vehicle_number VARCHAR(20) NOT NULL,
                    entry_time DATETIME NOT NULL,
                    exit_time DATETIME,
                    payment_status ENUM('pending', 'paid') DEFAULT 'pending',
                    amount DECIMAL(10, 2),
                    payment_intent_id VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;

            connection.query(createTableSQL, (err) => {
                if (err) {
                    console.error('Error creating vehicles table:', err);
                    return;
                }
                console.log('Vehicles table created successfully');

                // Add column if it doesn't exist (to handle existing databases)
                const alterTableSQL = `
                    ALTER TABLE vehicles 
                    ADD COLUMN IF NOT EXISTS payment_intent_id VARCHAR(255)
                `;

                connection.query(alterTableSQL, (err) => {
                    if (err) {
                        console.error('Error altering vehicles table:', err);
                    } else {
                        console.log('Added payment_intent_id column if not exists');
                    }
                    connection.end();
                });
            });
        });
    });
});
