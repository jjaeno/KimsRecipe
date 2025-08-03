
const mysql = require('mysql2/promise');

/*----MySQL연결----*/
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/* ---- 연결 테스트 ---- */
(async () => {
  try {
    const connection = await db.getConnection();
    console.log('MySQL 연결 성공 | 연결된 db: ', connection.config.database);
    connection.release(); // 연결 반환
  } catch (error) {
    console.error('MySQL 연결 실패:', error.message);
  }
})();
module.exports = db;