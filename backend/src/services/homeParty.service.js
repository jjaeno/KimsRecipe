// Responsibility: 홈파티 예약 도메인 로직. 필수값 검증 및 Repository 호출만 수행하며, HTTP 응답/상태코드는 Controller가 담당한다.
// 하지 않는 일: 라우팅, 응답 포맷 구성, 트랜잭션 관리(단일 insert라 불필요).

const pool = require('../db/pool');
const { AppError } = require('../utils/errors');

async function createReservation(userId, payload) {
  // 필수값(이름) 검증 후 insert
  const { name, phone, address, reservationDate, headCount, memo } = payload;
  if (!name) {
    throw new AppError(400, 'BAD_REQUEST', '예약자 이름이 필요합니다.');
  }
  const reservationId = await insertReservation(
    { userId, name, phone, address, reservationDate, headCount, memo },
  );
  return { reservationId };
}

async function listReservations(userId) {
  // 사용자별 목록 조회
  return listReservationsByUser(userId);
}

async function getReservation(userId, reservationId) {
  // 소유권 검증 + 단건 조회
  const reservation = await getReservationById(reservationId, userId);
  if (!reservation) {
    throw new AppError(404, 'NOT_FOUND', '예약을 찾을 수 없습니다.');
  }
  return reservation;
}


const withConn = (conn) => conn || pool;

async function insertReservation(data, conn) {
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
  listReservations,
  getReservation,
};


