require('dotenv').config();
const mysql = require('mysql2');

// MySQL Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

// Test data with different scenarios
const vehicles = [
    {
        vehicle_number: 'ABC123',
        // 30 minutes ago (should be FREE)
        entry_time: new Date(Date.now() - 30 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')
    },
    {
        vehicle_number: 'XYZ789',
        // 3 hours ago (should be 5 AED)
        entry_time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')
    }
];

// Connect and insert test data
db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        process.exit(1);
    }
    
    // Create database if it doesn't exist
    db.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`, (err) => {
        if (err) {
            console.error('Error creating database:', err);
            process.exit(1);
        }
        
        // Use the database
        db.query(`USE ${process.env.DB_NAME}`, (err) => {
            if (err) {
                console.error('Error using database:', err);
                process.exit(1);
            }
            
            // Create vehicles table
            const createTableQuery = `
                CREATE TABLE IF NOT EXISTS vehicles (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    vehicle_number VARCHAR(20) NOT NULL,
                    entry_time DATETIME NOT NULL,
                    exit_time DATETIME,
                    payment_status VARCHAR(10) DEFAULT 'pending',
                    amount DECIMAL(10,2),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;
            
            db.query(createTableQuery, (err) => {
                if (err) {
                    console.error('Error creating table:', err);
                    process.exit(1);
                }
                
                // Clear existing data
                db.query('DELETE FROM vehicles', (err) => {
                    if (err) {
                        console.error('Error clearing existing data:', err);
                        process.exit(1);
                    }
                    
                    // Insert test vehicles
                    vehicles.forEach((vehicle) => {
                        db.query(
                            'INSERT INTO vehicles (vehicle_number, entry_time) VALUES (?, ?)',
                            [vehicle.vehicle_number, vehicle.entry_time],
                            (err, result) => {
                                if (err) {
                                    console.error('Error inserting vehicle:', err);
                                } else {
                                    console.log(`Added vehicle ${vehicle.vehicle_number}`);
                                }
                            }
                        );
                    });
                    
                    console.log('Test data has been added. You can now test these vehicles:');
                    vehicles.forEach(v => console.log(`- ${v.vehicle_number}`));
                    
                    // Close connection after 1 second to ensure all queries complete
                    setTimeout(() => {
                        db.end();
                        process.exit(0);
                    }, 1000);
                });
            });
        });
    });
});
