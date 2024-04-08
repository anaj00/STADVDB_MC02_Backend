const express = require('express');
const mysql = require('mysql');
require('dotenv').config(); // Load environment variables from .env file

const app = express();

// MySQL Connection Configuration
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});

// Connect to MySQL
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL: ', err);
    return;
  }
  console.log('Connected to MySQL');
});

// Define API endpoint to fetch data
app.get('/api/data', (req, res) => {
  // Execute SELECT query to retrieve data from table
  const query = 'SELECT * FROM your_table_name';
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error executing MySQL query: ', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    // Log the retrieved data to the console
    console.log('Retrieved data:', results);
    // Send data as JSON response
    res.json(results);
  });
});

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
