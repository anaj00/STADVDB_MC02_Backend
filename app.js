// Import dependencies
const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env file

// Define app router and use cors
const app = express();
app.use(cors());
app.use(express.json()); // Parse JSON bodies

// Establish db connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL: ', err.stack);
    return;
  }
  console.log('Connected to MySQL');
});

// Create a record
app.post('/records', (req, res) => {
  const { pxid, apptid, status, TimeQueued, QueueDate, StartTime, EndTime, type, isVirtual, hospitalname, IsHospital, City, Province, RegionName, mainspecialty, age_x, age_y, gender, island } = req.body;
  const sql = 'INSERT INTO global_records (pxid, apptid, status, TimeQueued, QueueDate, StartTime, EndTime, type, isVirtual, hospitalname, IsHospital, City, Province, RegionName, mainspecialty, age_x, age_y, gender, island) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
  const values = [pxid, apptid, status, TimeQueued, QueueDate, StartTime, EndTime, type, isVirtual, hospitalname, IsHospital, City, Province, RegionName, mainspecialty, age_x, age_y, gender, island];
  
  db.beginTransaction((err) => {
    if (err) {
      console.error('Error beginning transaction: ', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('Error creating record: ', err);
        return db.rollback(() => {
          return res.status(500).json({ error: 'Internal server error' });
        });
      }
      db.commit((err) => {
        if (err) {
          console.error('Error committing transaction: ', err);
          return db.rollback(() => {
            return res.status(500).json({ error: 'Internal server error' });
          });
        }
        return res.status(201).json({ message: 'Record created successfully', id: result.insertId });
      });
    });
  });
});

// Read all records
app.get('/records', (req, res) => {
  const sql = 'SELECT * FROM global_records';
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error retrieving records: ', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    return res.json(results);
  });
});

// Read a single record by ID
app.get('/records/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'SELECT * FROM global_records WHERE id = ?';
  
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error retrieving record: ', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (!result[0]) {
      return res.status(404).json({ error: 'Record not found' });
    }
    return res.json(result[0]);
  });
});

// Update a record by ID
app.put('/records/:id', (req, res) => {
  const { id } = req.params;
  const { pxid, apptid, status, TimeQueued, QueueDate, StartTime, EndTime, type, isVirtual, hospitalname, IsHospital, City, Province, RegionName, mainspecialty, age_x, age_y, gender, island } = req.body;
  const sql = 'UPDATE global_records SET pxid = ?, apptid = ?, status = ?, TimeQueued = ?, QueueDate = ?, StartTime = ?, EndTime = ?, type = ?, isVirtual = ?, hospitalname = ?, IsHospital = ?, City = ?, Province = ?, RegionName = ?, mainspecialty = ?, age_x = ?, age_y = ?, gender = ?, island = ? WHERE id = ?';
  const values = [pxid, apptid, status, TimeQueued, QueueDate, StartTime, EndTime, type, isVirtual, hospitalname, IsHospital, City, Province, RegionName, mainspecialty, age_x, age_y, gender, island, id];
  
  db.beginTransaction((err) => {
    if (err) {
      console.error('Error beginning transaction: ', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('Error updating record: ', err);
        return db.rollback(() => {
          return res.status(500).json({ error: 'Internal server error' });
        });
      }
      db.commit((err) => {
        if (err) {
          console.error('Error committing transaction: ', err);
          return db.rollback(() => {
            return res.status(500).json({ error: 'Internal server error' });
          });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Record not found' });
        }
        return res.status(200).json({ message: 'Record updated successfully' });
      });
    });
  });
});

// Delete a record by ID
app.delete('/records/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM global_records WHERE id = ?';
  
  db.beginTransaction((err) => {
    if (err) {
      console.error('Error beginning transaction: ', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    db.query(sql, [id], (err, result) => {
      if (err) {
        console.error('Error deleting record: ', err);
        return db.rollback(() => {
          return res.status(500).json({ error: 'Internal server error' });
        });
      }
      db.commit((err) => {
        if (err) {
          console.error('Error committing transaction: ', err);
          return db.rollback(() => {
            return res.status(500).json({ error: 'Internal server error' });
          });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Record not found' });
        }
        return res.status(200).json({ message: 'Record deleted successfully' });
      });
    });
  });
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
