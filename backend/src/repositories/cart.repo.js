// Responsibility: 장바구니 관련 SQL만 수행한다. 트랜잭션 경계와 비즈니스 규칙은 Service가 제어하며, 이 레이어는 “오직 DB 질의/결과 반환”만 담당한다.
// 절대 하지 말아야 할 것: 입력 유효성 검증, 트랜잭션 commit/rollback, 응답 포맷/HTTP 처리, 비즈니스 규칙 판단.

const pool = require('../db/pool');
const withConn = (conn) => conn || pool;

async function getCartByUser(userId, conn) {
  // 유저당 CART 1개만 허용하는 가정 하에 LIMIT 1 조회
  const executor = withConn(conn);
  const [rows] = await executor.query('SELECT cartId, storeId FROM carts WHERE userId = ? LIMIT 1', [userId]);
  return rows[0] || null;
}

async function getCartByIdAndUser(cartId, userId, conn) {
  // 주문 생성 시 cart 소유권 검증을 위해 cartId + userId 매칭 조회
  const executor = withConn(conn);
  const [rows] = await executor.query(
    'SELECT cartId, storeId, userId FROM carts WHERE cartId = ? AND userId = ? LIMIT 1',
    [cartId, userId],
  );
  return rows[0] || null;
}

async function createCart(userId, storeId, conn) {
  // 신규 CART 생성 시 storeId 컨텍스트를 부여
  const executor = withConn(conn);
  const [result] = await executor.query('INSERT INTO carts (userId, storeId) VALUES (?, ?)', [userId, storeId]);
  return result.insertId;
}

async function updateCartStore(cartId, storeId, conn) {
  // 다른 매장으로 전환(force 포함) 시 CART의 storeId 갱신
  const executor = withConn(conn);
  await executor.query('UPDATE carts SET storeId = ? WHERE cartId = ?', [storeId, cartId]);
}

async function countCartItems(cartId, conn) {
  // storeId 컨텍스트 충돌 체크용 아이템 개수 조회
  const executor = withConn(conn);
  const [[row]] = await executor.query('SELECT COUNT(*) AS cnt FROM cart_items WHERE cartId = ?', [cartId]);
  return Number(row.cnt || 0);
}

async function getCartItemsWithMenu(cartId, conn) {
  // 장바구니 상세 조회용 조인 (가격/설명 등 메뉴 스냅샷 포함)
  const executor = withConn(conn);
  const [rows] = await executor.query(
    `SELECT
        ci.cartItemId,
        ci.storeMenuId,
        ci.quantity,
        sm.menuName AS name,
        sm.price AS price,
        sm.imageUrl AS imageUrl,
        sm.description AS description,
        sm.amount AS amount,
        sm.storeId AS storeId
     FROM cart_items ci
     JOIN storemenus sm ON sm.storeMenuId = ci.storeMenuId
     WHERE ci.cartId = ?`,
    [cartId],
  );
  return rows;
}

async function upsertCartItem(cartId, storeMenuId, quantity, conn) {
  // UNIQUE(cartId, storeMenuId) 제약 기반 upsert (수량 누적)
  const executor = withConn(conn);
  await executor.query(
    `INSERT INTO cart_items (cartId, storeMenuId, quantity)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
    [cartId, storeMenuId, quantity],
  );
}

async function setCartItemQuantity(cartId, storeMenuId, quantity, conn) {
  // 수량 덮어쓰기(PATCH 용)
  const executor = withConn(conn);
  await executor.query(
    `UPDATE cart_items SET quantity = ? WHERE cartId = ? AND storeMenuId = ?`,
    [quantity, cartId, storeMenuId],
  );
}

async function deleteCartItem(cartId, storeMenuId, conn) {
  // 개별 아이템 삭제
  const executor = withConn(conn);
  const [result] = await executor.query(
    `DELETE FROM cart_items WHERE cartId = ? AND storeMenuId = ?`,
    [cartId, storeMenuId],
  );
  return result.affectedRows;
}

async function clearCartItems(cartId, conn) {
  // 장바구니 비우기(주문 성공/force 스위치 시 사용)
  const executor = withConn(conn);
  await executor.query('DELETE FROM cart_items WHERE cartId = ?', [cartId]);
}

module.exports = {
  getCartByUser,
  getCartByIdAndUser,
  createCart,
  updateCartStore,
  countCartItems,
  getCartItemsWithMenu,
  upsertCartItem,
  setCartItemQuantity,
  deleteCartItem,
  clearCartItems,
};
