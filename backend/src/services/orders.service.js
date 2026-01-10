// Responsibility: 주문 도메인 규칙 및 트랜잭션 관리. 장바구니를 주문으로 전환하면서 스냅샷 데이터를 저장하고, 부분 실패 시 롤백한다. SQL은 Repository에 위임한다.
// Service가 하는 일: 소유권 검증, 비어있는 카트 방지, 총액 계산, 트랜잭션(begin/commit/rollback), cart -> order/order_items 복사 후 cart 비우기.
// Service가 하지 않는 일: HTTP 응답/상태코드 결정, 라우팅, JWT 검증, DB 커넥션 풀 생성.

const pool = require('../db/pool');
const { AppError } = require('../utils/errors');

const withConn = (conn) => conn || pool;

async function withTransaction(fn) {
  // 트랜잭션 헬퍼: 주문 생성처럼 다중 쿼리 원자성을 보장한다.
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    try { await conn.rollback(); } catch {}
    throw err;
  } finally {
    conn.release();
  }
}

async function createOrderFromCart({ userId, cartId }) {
  // 트랜잭션 경계: cart 소유 검증 -> 주문/주문항목 insert -> cart 비우기 -> commit
  if (!cartId) {
    throw new AppError(400, 'BAD_REQUEST', 'cartId가 필요합니다.');
  }

  return withTransaction(async (conn) => {
    const cart = await getCartByIdAndUser(cartId, userId, conn);
    if (!cart) {
      throw new AppError(404, 'NOT_FOUND', '사용자 장바구니를 찾을 수 없습니다.');
    }
    const cartItems = await getCartItemsWithMenu(cartId, conn);
    if (!cartItems.length) {
      throw new AppError(400, 'BAD_REQUEST', '장바구니가 비어 있습니다.');
    }
    // 주문 총액 계산: 메뉴 가격 * 수량 합산
    const totalPrice = cartItems.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);

    const orderId = await createOrder(conn, {
      userId,
      storeId: cart.storeId,
      totalPrice,
      status: 'CREATED',
    });

    // 주문 항목 스냅샷 저장 (가격/이름을 주문 시점에 고정)
    await createOrderItems(
      conn,
      orderId,
      cartItems.map((item) => ({
        storeMenuId: item.storeMenuId,
        quantity: item.quantity,
        menuName: item.name,
        price: item.price,
        imageUrl: item.imageUrl,
      })),
    );

    // 정책: 주문 생성 성공 시 cart_items 비우기
    await clearCartItems(cartId, conn);

    return { orderId, totalPrice, storeId: cart.storeId };
  });
}

async function listOrders(userId) {
  return listOrdersByUser(userId);
}

async function getOrderDetail({ userId, orderId }) {
  const order = await getOrderById(orderId, userId);
  if (!order) {
    throw new AppError(404, 'NOT_FOUND', '주문을 찾을 수 없습니다.');
  }
  const items = await getOrderItems(orderId);
  return { order, items };
}


async function getCartByIdAndUser(cartId, userId, conn) {
  const executor = withConn(conn);
  const [rows] = await executor.query(
    'SELECT cartId, storeId, userId FROM carts WHERE cartId = ? AND userId = ? LIMIT 1',
    [cartId, userId],
  );
  return rows[0] || null;
}

async function getCartItemsWithMenu(cartId, conn) {
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

async function clearCartItems(cartId, conn) {
  const executor = withConn(conn);
  await executor.query('DELETE FROM cart_items WHERE cartId = ?', [cartId]);
}

async function createOrder(conn, { userId, storeId, totalPrice, status = 'PENDING' }) {
  const executor = withConn(conn);
  const [result] = await executor.query(
    `INSERT INTO orders (userId, storeId, totalPrice, status)
     VALUES (?, ?, ?, ?)`,
    [userId, storeId, totalPrice, status],
  );
  return result.insertId;
}

async function createOrderItems(conn, orderId, items) {
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
  createOrderFromCart,
  listOrders,
  getOrderDetail,
};








