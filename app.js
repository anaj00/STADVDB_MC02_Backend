// Import dependencies
const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env file

// Define app router and use cors
const app = express();
app.use(cors())

// Establish db connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port:  process.env.DB_PORT,
  user:  process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});


app.get('/', (req, res)=>{
  const sql = "SELECT * FROM global_records"
  db.query(sql, (err, data) =>{
    if(err) return res.json(err);
    return res.json(data);
  })
  return res.json("From backend side")
});


// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL: ', err.stack);
    return;
  }
  console.log('Connected to MySQL');
});


// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});


