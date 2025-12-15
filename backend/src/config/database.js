const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: "10.3.0.249",
  user: "root",
  password: "rootpassword",     
  port: 3307,        
  database: "doc_management"
});

module.exports = db;
