// Import dependencies
const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env file

// Define app router and use cors
const app = express();
app.use(cors());
app.use(express.json()); // Parse JSON bodies

let isServer1OK = false;
let isServer2OK = false;
let isServer3OK = false;

// Establish db connection
const db1 = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT_1,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

const db2 = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT_2,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

const db3 = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT_3,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

function startServer() {
  if (!isServer1OK && !isServer2OK && !isServer3OK) {
    const port = process.env.PORT || 5000;
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  }
}

// Connect to MySQL
db1.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL on server 1: ', err.stack);
    // Attempt to connect to server 2
    db2.connect((err) => {
      if (err) {
        console.error('Error connecting to MySQL on server 2: ', err.stack);
        // Attempt to connect to server 3
        db3.connect((err) => {
          if (err) {
            console.error('Error connecting to MySQL on server 3: ', err.stack);
            console.error('All servers are down. Cannot establish database connection.');
          } else {
            console.log('Connected to MySQL on server 3');
            isServer3OK = true;
            db = db3;
          }
        });
      } else {
        console.log('Connected to MySQL on server 2');
        isServer2OK = true;
        db = db2
      }
    });
  } else {
    console.log('Connected to MySQL on server 1');
    isServer1OK = true;
    db = db1;
  }
});

// Create a record

app.post('/records', (req, res) => {
  if (!isServer1OK) {
    return res.status(403).json({ error: 'Write operations not allowed when connected to any server' });
  }
  const { pxid, apptid, status, TimeQueued, QueueDate, StartTime, EndTime, type, isVirtual, hospitalname, IsHospital, City, Province, RegionName, mainspecialty, age_x, age_y, gender, island } = req.body;
  console.log(req.body);
  const sql = 'INSERT INTO global_records (pxid, apptid, status, TimeQueued, QueueDate, StartTime, EndTime, type, isVirtual, hospitalname, IsHospital, City, Province, RegionName, mainspecialty, age_x, age_y, gender, islands) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
  const values = [pxid, apptid, status, TimeQueued, QueueDate, StartTime, EndTime, type, isVirtual, hospitalname, IsHospital, City, Province, RegionName, mainspecialty, age_x, age_y, gender, island];
  console.log("hi");
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
  const { page, itemsPerPage, search } = req.query;
  const offset = (page - 1) * itemsPerPage;
  let sql = 'SELECT * FROM global_records';
  let countSql = 'SELECT COUNT(*) AS totalCount FROM global_records';
  const queryParams = [];

  // Add search condition if provided
  if (search) {
    sql += ' WHERE pxid LIKE ? OR apptid LIKE ?'; // Adjust conditions based on your search criteria
    countSql += ' WHERE pxid LIKE ? OR apptid LIKE ?'; // Adjust conditions based on your search criteria
    queryParams.push(`%${search}%`, `%${search}%`);
  }

  sql += ' LIMIT ?, ?';
  queryParams.push(offset, parseInt(itemsPerPage));

  db.query(sql, queryParams, (err, results) => {
    if (err) {
      console.error('Error retrieving records: ', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    // Query total count of records
    db.query(countSql, queryParams.slice(0, -2), (countErr, countResults) => {
      if (countErr) {
        console.error('Error counting records: ', countErr);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      const totalCount = countResults[0].totalCount;
      const totalPages = Math.ceil(totalCount / parseInt(itemsPerPage));
      
      return res.json({ items: results, total: totalCount, totalPages: totalPages });
    });
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
  if (!isServer1OK) {
    return res.status(403).json({ error: 'Write operations not allowed when connected to any server' });
  }
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
  if (!isServer1OK) {
    return res.status(403).json({ error: 'Write operations not allowed when connected to any server' });
  }
  const { id } = req.params;
  const sql = 'DELETE FROM global_records WHERE pxid = ?';
  
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
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
