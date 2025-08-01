const mysql = require('mysql2/promise');

/*----MySQL연결----*/
const db = mysql.createPool({
  host: 'localhost',
  user: 
  password: 
  database: 
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = db;