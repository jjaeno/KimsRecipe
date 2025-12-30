// Responsibility: 홈파티 예약 관련 SQL 전담. 입력 검증/비즈니스 규칙은 Service에서 처리하고, 여기서는 CRUD만 수행한다.
// 하지 말아야 할 것: 유효성 검사, 권한/소유권 판단, 응답 포맷 구성, 트랜잭션 commit/rollback.

const pool = require('../db/pool');
const withConn = (conn) => conn || pool;

async function createReservation(data, conn) {
  // 예약 생성. 필수/선택 필드 검증은 Service에서 수행.
  const executor = withConn(conn);
  const {
    userId,
    name,
    phone,
    address,
    reservationDate,
    headCount,
    memo,
  } = data;
  const [result] = await executor.query(
    `INSERT INTO home_party_reservations (userId, name, phone, address, reservationDate, headCount, memo)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, name, phone || null, address || null, reservationDate || null, headCount || null, memo || null],
  );
  return result.insertId;
}

async function listReservationsByUser(userId, conn) {
  // 사용자별 예약 목록 조회 (최신 순)
  const executor = withConn(conn);
  const [rows] = await executor.query(
    `SELECT reservationId, userId, name, phone, address, reservationDate, headCount, memo, createdAt
     FROM home_party_reservations
     WHERE userId = ?
     ORDER BY reservationId DESC`,
    [userId],
  );
  return rows;
}

async function getReservationById(reservationId, userId, conn) {
  // 소유권이 맞는 예약 단건 조회
  const executor = withConn(conn);
  const [rows] = await executor.query(
    `SELECT reservationId, userId, name, phone, address, reservationDate, headCount, memo, createdAt
     FROM home_party_reservations
     WHERE reservationId = ? AND userId = ?
     LIMIT 1`,
    [reservationId, userId],
  );
  return rows[0] || null;
}

module.exports = {
  createReservation,
  listReservationsByUser,
  getReservationById,
};
