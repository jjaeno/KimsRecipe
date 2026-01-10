// Responsibility: 장바구니 도메인 규칙과 트랜잭션을 관리한다.
// Service가 하는 일:
// - 입력 검증 및 비즈니스 규칙(동일 매장 컨텍스트, CART 1개 보장)
// - 트랜잭션 경계 설정(begin/commit/rollback) 및 실패 시 롤백
// - SQL 실행
// Service가 하지 않는 일: HTTP 응답 작성, Express next 호출, 라우팅.

const pool = require('../db/pool');
const { AppError } = require('../utils/errors');

const isPosInt = (v) => Number.isInteger(Number(v)) && Number(v) > 0;
const withConn = (conn) => conn || pool;

async function getCart(userId) {
  // 조회를 실행하며 트랜잭션은 불필요, 카트 상태 반환.
  const cart = await getCartByUser(userId);
  if (!cart) {
    return { cartId: null, storeId: null, items: [] };
  }
  const items = await getCartItemsWithMenu(cart.cartId);
  return {
    cartId: cart.cartId,
    storeId: cart.storeId,
    items: items.map((r) => ({
      storeMenuId: String(r.storeMenuId),
      name: r.name,
      description: r.description,
      price: r.price,
      amount: r.amount,
      image: r.imageUrl,
      quantity: r.quantity,
      storeId: r.storeId,
    })),
  };
}

// 공통 트랜잭션 실행 헬퍼
async function withTransaction(fn) {
  // 공통 트랜잭션 헬퍼: Service 내부에서 사용. commit/rollback 책임은 함수가 가진다.
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

async function addItem({ userId, storeId, storeMenuId, quantity }) {
  // 비즈니스 규칙: 숫자 검증 -> 메뉴 존재/매장 일치 확인 -> CART 생성/확인 -> store 컨텍스트 충돌 검증(DIFFERENT_STORE 409) -> upsert
  if (!isPosInt(storeId) || !isPosInt(storeMenuId) || !isPosInt(quantity)) {
    throw new AppError(400, 'BAD_REQUEST', '숫자 값이 필요합니다.');
  }

  return withTransaction(async (conn) => {
    const menu = await findMenuById(storeMenuId, conn);
    if (!menu || Number(menu.storeId) !== Number(storeId)) {
      throw new AppError(400, 'BAD_REQUEST', '해당 매장의 메뉴가 아닙니다.');
    }

    let cart = await getCartByUser(userId, conn);
    let cartId;
    if (!cart) {
      cartId = await createCart(userId, storeId, conn);
    } else {
      cartId = cart.cartId;
      if (Number(cart.storeId) !== Number(storeId)) {
        const itemCount = await countCartItems(cartId, conn);
        if (itemCount > 0) {
          throw new AppError(409, 'DIFFERENT_STORE', '다른 매장 장바구니가 존재합니다. 초기화 후 다시 담아주세요.', {
            currentStoreId: Number(cart.storeId),
            currentItemCount: itemCount,
            requestedStoreId: Number(storeId),
          });
        }
        await updateCartStore(cartId, storeId, conn);
      }
    }

    await upsertCartItem(cartId, storeMenuId, quantity, conn);
    return { cartId, storeId: Number(storeId) };
  });
}

async function forceAddItem({ userId, storeId, storeMenuId, quantity }) {
  // 비즈니스 규칙: 다른 매장 아이템 강제 담기. 기존 cart_items 삭제 후 storeId 전환, 이후 upsert.
  if (!isPosInt(storeId) || !isPosInt(storeMenuId) || !isPosInt(quantity)) {
    throw new AppError(400, 'BAD_REQUEST', '숫자 값이 필요합니다.');
  }

  return withTransaction(async (conn) => {
    const menu = await findMenuById(storeMenuId, conn);
    if (!menu || Number(menu.storeId) !== Number(storeId)) {
      throw new AppError(400, 'BAD_REQUEST', '해당 매장의 메뉴가 아닙니다.');
    }

    let cart = await getCartByUser(userId, conn);
    let cartId;
    if (!cart) {
      cartId = await createCart(userId, storeId, conn);
    } else {
      cartId = cart.cartId;
      // force: 기존 아이템 전부 삭제 후 store 전환
      await clearCartItems(cartId, conn);
      if (Number(cart.storeId) !== Number(storeId)) {
        await updateCartStore(cartId, storeId, conn);
      }
    }
    await upsertCartItem(cartId, storeMenuId, quantity, conn);
    return { cartId, storeId: Number(storeId) };
  });
}

async function updateItemQuantity({ userId, storeMenuId, quantity }) {
  // 비즈니스 규칙: CART 존재해야 하며, 없는 메뉴는 404. 수량은 양의 정수.
  if (!isPosInt(storeMenuId) || !isPosInt(quantity)) {
    throw new AppError(400, 'BAD_REQUEST', '숫자 값이 필요합니다.');
  }
  return withTransaction(async (conn) => {
    const cart = await getCartByUser(userId, conn);
    if (!cart) {
      throw new AppError(404, 'NOT_FOUND', '장바구니가 존재하지 않습니다.');
    }
    await setCartItemQuantity(cart.cartId, storeMenuId, quantity, conn);
    return { cartId: cart.cartId, storeId: cart.storeId };
  });
}

async function removeItem({ userId, storeMenuId }) {
  // 비즈니스 규칙: CART 존재 + 개별 메뉴 존재 여부 확인. 존재하지 않으면 404.
  if (!isPosInt(storeMenuId)) {
    throw new AppError(400, 'BAD_REQUEST', '숫자 값이 필요합니다.');
  }
  return withTransaction(async (conn) => {
    const cart = await getCartByUser(userId, conn);
    if (!cart) {
      throw new AppError(404, 'NOT_FOUND', '장바구니가 존재하지 않습니다.');
    }
    const affected = await deleteCartItem(cart.cartId, storeMenuId, conn);
    if (!affected) {
      throw new AppError(404, 'NOT_FOUND', '해당 메뉴가 장바구니에 없습니다.');
    }
    return { cartId: cart.cartId, storeId: cart.storeId };
  });
}

async function clearCart(userId) {
  // CART가 없으면 cleared=false, 있으면 cart_items 삭제
  return withTransaction(async (conn) => {
    const cart = await getCartByUser(userId, conn);
    if (!cart) {
      return { cleared: false };
    }
    await clearCartItems(cart.cartId, conn);
    return { cleared: true };
  });
}

async function findMenuById(storeMenuId, conn) {
  const executor = withConn(conn);
  const [rows] = await executor.query('SELECT * FROM storemenus WHERE storeMenuId = ? LIMIT 1', [storeMenuId]);
  return rows[0] || null;
}

async function getCartByUser(userId, conn) {
  const executor = withConn(conn);
  const [rows] = await executor.query('SELECT cartId, storeId FROM carts WHERE userId = ? LIMIT 1', [userId]);
  return rows[0] || null;
}

async function createCart(userId, storeId, conn) {
  const executor = withConn(conn);
  const [result] = await executor.query('INSERT INTO carts (userId, storeId) VALUES (?, ?)', [userId, storeId]);
  return result.insertId;
}

async function updateCartStore(cartId, storeId, conn) {
  const executor = withConn(conn);
  await executor.query('UPDATE carts SET storeId = ? WHERE cartId = ?', [storeId, cartId]);
}

async function countCartItems(cartId, conn) {
  const executor = withConn(conn);
  const [[row]] = await executor.query('SELECT COUNT(*) AS cnt FROM cart_items WHERE cartId = ?', [cartId]);
  return Number(row.cnt || 0);
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

async function upsertCartItem(cartId, storeMenuId, quantity, conn) {
  const executor = withConn(conn);
  await executor.query(
    `INSERT INTO cart_items (cartId, storeMenuId, quantity)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
    [cartId, storeMenuId, quantity],
  );
}

async function setCartItemQuantity(cartId, storeMenuId, quantity, conn) {
  const executor = withConn(conn);
  await executor.query(
    `UPDATE cart_items SET quantity = ? WHERE cartId = ? AND storeMenuId = ?`,
    [quantity, cartId, storeMenuId],
  );
}

async function deleteCartItem(cartId, storeMenuId, conn) {
  const executor = withConn(conn);
  const [result] = await executor.query(
    `DELETE FROM cart_items WHERE cartId = ? AND storeMenuId = ?`,
    [cartId, storeMenuId],
  );
  return result.affectedRows;
}

async function clearCartItems(cartId, conn) {
  const executor = withConn(conn);
  await executor.query('DELETE FROM cart_items WHERE cartId = ?', [cartId]);
}

module.exports = {
  getCart,
  addItem,
  forceAddItem,
  updateItemQuantity,
  removeItem,
  clearCart,
};
