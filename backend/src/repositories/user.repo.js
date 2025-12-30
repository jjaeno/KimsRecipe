// Responsibility: 사용자 관련 SQL만 수행한다. 비즈니스 규칙(중복 체크, 비밀번호 정책 등)은 Service에서 처리하며, 여기서는 DB 질의/결과 반환만 담당한다.
// 하지 말아야 할 것: 입력 검증, 토큰 발급, 에러 핸들링(HTTP), 트랜잭션 관리.

const pool = require('../db/pool');

const withConn = (conn) => conn || pool;

async function findByUsername(username, conn) {
  // username으로 단건 조회 (로그인/중복 체크)
  const executor = withConn(conn);
  const [rows] = await executor.query('SELECT * FROM users WHERE username = ? LIMIT 1', [username]);
  return rows[0] || null;
}

async function createUser({ username, name, password, phone }, conn) {
  // 회원가입 시 사용자 생성
  const executor = withConn(conn);
  const [result] = await executor.query(
    'INSERT INTO users (username, name, password, phone) VALUES (?, ?, ?, ?)',
    [username, name, password, phone || null],
  );
  return result.insertId;
}

async function findById(userId, conn) {
  // userId 단건 조회
  const executor = withConn(conn);
  const [rows] = await executor.query('SELECT * FROM users WHERE userId = ? LIMIT 1', [userId]);
  return rows[0] || null;
}

module.exports = {
  findByUsername,
  createUser,
  findById,
};
