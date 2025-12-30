// Responsibility: 주문/주문항목 관련 SQL 전담. 트랜잭션 관리와 도메인 검증은 Service에서 처리하며, 여기서는 insert/select만 수행한다.
// 하지 말아야 할 것: 트랜잭션 commit/rollback, 사용자 권한 검증, 응답 포맷 결정, 도메인 규칙 판단.

const pool = require('../db/pool');
const withConn = (conn) => conn || pool;

async function createOrder(conn, { userId, storeId, totalPrice, status = 'PENDING' }) {
  // 주문 본문 생성. status 기본값은 Service에서 전달하는 값 사용.
  const executor = withConn(conn);
  const [result] = await executor.query(
    `INSERT INTO orders (userId, storeId, totalPrice, status)
     VALUES (?, ?, ?, ?)`,
    [userId, storeId, totalPrice, status],
  );
  return result.insertId;
}

async function createOrderItems(conn, orderId, items) {
  // 주문 항목 스냅샷 insert. 메뉴명/가격을 주문 시점에 고정 저장.
  if (!items.length) return;
  const executor = withConn(conn);
  const values = items.map(() => '(?, ?, ?, ?, ?, ?)').join(',');
  const params = [];
  for (const item of items) {
    params.push(orderId, item.storeMenuId, item.quantity, item.menuName, item.price, item.imageUrl || null);
  }
  await executor.query(
    `INSERT INTO order_items (orderId, storeMenuId, quantity, menuName, price, imageUrl) VALUES ${values}`,
    params,
  );
}

async function listOrdersByUser(userId, conn) {
  // 사용자별 주문 목록 조회 (최신 순)
  const executor = withConn(conn);
  const [rows] = await executor.query(
    `SELECT orderId, storeId, totalPrice, status, createdAt
     FROM orders
     WHERE userId = ?
     ORDER BY orderId DESC`,
    [userId],
  );
  return rows;
}

async function getOrderById(orderId, userId, conn) {
  // 주문 소유권 검증 겸 단건 조회
  const executor = withConn(conn);
  const [rows] = await executor.query(
    `SELECT orderId, storeId, totalPrice, status, createdAt
     FROM orders
     WHERE orderId = ? AND userId = ?
     LIMIT 1`,
    [orderId, userId],
  );
  return rows[0] || null;
}

async function getOrderItems(orderId, conn) {
  // 주문 항목 상세 조회 (스냅샷 데이터)
  const executor = withConn(conn);
  const [rows] = await executor.query(
    `SELECT orderItemId, orderId, storeMenuId, quantity, menuName, price, imageUrl
     FROM order_items
     WHERE orderId = ?`,
    [orderId],
  );
  return rows;
}

module.exports = {
  createOrder,
  createOrderItems,
  listOrdersByUser,
  getOrderById,
  getOrderItems,
};
