// Responsibility: 장바구니 도메인 규칙과 트랜잭션을 관리한다.
// Service가 하는 일:
// - 입력 검증 및 비즈니스 규칙(동일 매장 컨텍스트, CART 1개 보장)
// - 트랜잭션 경계 설정(begin/commit/rollback) 및 실패 시 롤백
// - SQL 실행
// Service가 하지 않는 일: HTTP 응답 작성, Express next 호출, 라우팅.

const pool = require('../db/pool');
const { AppError } = require('../utils/errors');

const isPosInt = (v) => Number.isInteger(Number(v)) && Number(v) > 0;
const isNonNegInt = (v) => Number.isInteger(Number(v)) && Number(v) >= 0;
const MAX_QTY = 99;
const withConn = (conn) => conn || pool;

// 장바구니 조회
async function getCart(userId) {
  // 조회는 트랜잭션 불필요. 카트가 없으면 빈 구조를 반환한다.
  const cart = await getCartByUser(userId);
  if (!cart) {
    return { cartId: null, storeId: null, items: [], summary: emptySummary() };
  }
  const items = await getCartItemsWithMenu(cart.cartId); // 아이템 및 메뉴 정보 조회
  const summary = await getCartSummary(cart, items, userId); // 요약 정보 계산
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
      menuStatus: r.menuStatus,
      quantity: r.quantity,
      storeId: r.storeId,
    })),
    summary,
  };
}

// 공통 트랜잭션 실행 헬퍼
async function withTransaction(fn) {
  // 트랜잭션 경계는 서비스에서 명시한다. 실패 시 롤백하여 무결성을 보장한다.
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

// 장바구니에 아이템 추가
async function addItem({ userId, storeId, storeMenuId, quantity }) {
  // 입력 검증: 음수/0/상한 초과 방지, 명세상 INVALID_INPUT으로 매핑
  if (!isPosInt(storeId) || !isPosInt(storeMenuId) || !isPosInt(quantity) || Number(quantity) > MAX_QTY) {
    throw new AppError(400, 'INVALID_INPUT', '수량/아이디 값이 올바르지 않습니다.');
  }

  return withTransaction(async (conn) => {
    // 메뉴 존재/매장 일치 검증: 타 매장 메뉴면 BAD_REQUEST
    const menu = await findMenuById(storeMenuId, conn);
    if (!menu || Number(menu.storeId) !== Number(storeId)) {
      throw new AppError(400, 'BAD_REQUEST', '해당 매장의 메뉴가 아닙니다.');
    }

    // cartId는 항상 userId 기반으로 확정하여 권한을 보장한다.
    let cart = await getCartByUser(userId, conn);
    let cartId;
    if (!cart) {
      cartId = await createCart(userId, storeId, conn);
    } else {
      cartId = cart.cartId;
      if (Number(cart.storeId) !== Number(storeId)) {
        // 다른 매장 정책: 아이템이 있으면 409 DIFFERENT_STORE
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

    // upsert는 최종 quantity로 덮어쓴다(원자적 set).
    await upsertCartItem(cartId, storeMenuId, quantity, conn);
    return { cartId, storeId: Number(storeId) };
  });
}

async function forceAddItem({ userId, storeId, storeMenuId, quantity }) {
  // 입력 검증: 음수/0/상한 초과 방지, 명세상 INVALID_INPUT으로 매핑
  if (!isPosInt(storeId) || !isPosInt(storeMenuId) || !isPosInt(quantity) || Number(quantity) > MAX_QTY) {
    throw new AppError(400, 'INVALID_INPUT', '수량/아이디 값이 올바르지 않습니다.');
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
  // 입력 검증: 0은 삭제로 허용, 음수/상한 초과는 INVALID_INPUT
  if (!isPosInt(storeMenuId) || !isNonNegInt(quantity) || Number(quantity) > MAX_QTY) {
    throw new AppError(400, 'INVALID_INPUT', '수량/아이디 값이 올바르지 않습니다.');
  }
  return withTransaction(async (conn) => {
    const cart = await getCartByUser(userId, conn);
    if (!cart) {
      throw new AppError(404, 'NOT_FOUND', '장바구니가 존재하지 않습니다.');
    }
    if (Number(quantity) === 0) {
      // 0이면 삭제 처리, 존재하지 않으면 404로 매핑
      const deleted = await deleteCartItem(cart.cartId, storeMenuId, conn);
      if (!deleted) {
        throw new AppError(404, 'NOT_FOUND', '해당 메뉴가 장바구니에 없습니다.');
      }
    } else {
      // 수량은 최종 값으로 set, row 미존재면 404
      const affected = await setCartItemQuantity(cart.cartId, storeMenuId, quantity, conn);
      if (!affected) {
        throw new AppError(404, 'NOT_FOUND', '해당 메뉴가 장바구니에 없습니다.');
      }
    }
    return { cartId: cart.cartId, storeId: cart.storeId };
  });
}

async function removeItem({ userId, storeMenuId }) {
  // 입력 검증: INVALID_INPUT으로 매핑
  if (!isPosInt(storeMenuId)) {
    throw new AppError(400, 'INVALID_INPUT', '숫자 값이 필요합니다.');
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

async function removeItemsBulk({ userId, storeMenuIds }) {
  // 입력 검증: 배열 유효성 및 숫자 검증
  if (!Array.isArray(storeMenuIds) || storeMenuIds.length === 0) {
    throw new AppError(400, 'INVALID_INPUT', '삭제할 메뉴 목록이 필요합니다.');
  }
  const normalized = storeMenuIds.map((v) => Number(v)).filter((v) => Number.isInteger(v) && v > 0);
  if (normalized.length !== storeMenuIds.length) {
    throw new AppError(400, 'INVALID_INPUT', '삭제할 메뉴 목록이 올바르지 않습니다.');
  }

  return withTransaction(async (conn) => {
    const cart = await getCartByUser(userId, conn);
    if (!cart) {
      throw new AppError(404, 'NOT_FOUND', '장바구니가 존재하지 않습니다.');
    }
    // 다건 삭제는 트랜잭션으로 원자 처리
    const affected = await deleteCartItemsBulk(cart.cartId, normalized, conn);
    return { cartId: cart.cartId, removed: affected };
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

async function validateCart({ userId, priceMap, selectedIds }) {
  // 판매상태/가격 재검증: 위변조/품절/숨김은 409로 차단한다.
  const cart = await getCartByUser(userId);
  if (!cart) {
    return { valid: true, cartId: null, items: [], summary: emptySummary() };
  }

  const items = await getCartItemsWithMenu(cart.cartId);
  // selectedIds가 주어지면 필터링
  const filteredItems = Array.isArray(selectedIds) && selectedIds.length > 0
    ? items.filter((it) => selectedIds.includes(String(it.storeMenuId)) || selectedIds.includes(Number(it.storeMenuId)))
    : items;

  const summary = await getCartSummary(cart, filteredItems);

  const invalidItems = [];
  for (const item of filteredItems) {
    if (item.menuStatus === 'SOLD_OUT') {
      invalidItems.push({
        storeMenuId: String(item.storeMenuId),
        reason: 'SOLD_OUT_ITEM',
        currentPrice: item.price,
        menuStatus: item.menuStatus,
      });
    }
    if (item.menuStatus === 'HIDDEN') {
      invalidItems.push({
        storeMenuId: String(item.storeMenuId),
        reason: 'MENU_HIDDEN',
        currentPrice: item.price,
        menuStatus: item.menuStatus,
      });
    }
    // 클라이언트가 priceMap을 전달하면 가격 위변조/변경 감지
    if (priceMap && priceMap[item.storeMenuId] != null) {
      const clientPrice = Number(priceMap[item.storeMenuId]);
      if (Number.isFinite(clientPrice) && Number(clientPrice) !== Number(item.price)) {
        invalidItems.push({
          storeMenuId: String(item.storeMenuId),
          reason: 'PRICE_CHANGED',
          currentPrice: item.price,
          menuStatus: item.menuStatus,
        });
      }
    }
  }

  if (invalidItems.length > 0) {
    // 대표 코드 선택: SOLD_OUT 우선, 다음 HIDDEN, 다음 PRICE_CHANGED
    const hasSoldOut = invalidItems.some((it) => it.reason === 'SOLD_OUT_ITEM');
    const hasHidden = invalidItems.some((it) => it.reason === 'MENU_HIDDEN');
    const hasPrice = invalidItems.some((it) => it.reason === 'PRICE_CHANGED');
    const code = hasSoldOut ? 'SOLD_OUT_ITEM' : hasHidden ? 'MENU_HIDDEN' : 'PRICE_CHANGED';
    const message =
      code === 'SOLD_OUT_ITEM'
        ? '품절된 메뉴가 포함되어 있습니다.'
        : code === 'MENU_HIDDEN'
          ? '숨김 처리된 메뉴가 포함되어 있습니다.'
          : '메뉴 가격이 변경되었습니다.';
    throw new AppError(409, code, message, { items: invalidItems, summary });
  }

  return { valid: true, cartId: cart.cartId, items: normalizeCartItems(filteredItems), summary };
}

function emptySummary() {
  return {
    storeId: null,
    storeName: null,
    minOrderAmount: 0,
    baseDeliveryFee: 0,
    totalPrice: 0,
  };
}

function normalizeCartItems(items) {
  return items.map((r) => ({
    storeMenuId: String(r.storeMenuId),
    name: r.name,
    description: r.description,
    price: r.price,
    amount: r.amount,
    image: r.imageUrl,
    menuStatus: r.menuStatus,
    quantity: r.quantity,
    storeId: r.storeId,
  }));
}

async function getCartSummary(cart, items, userId, conn) {
  const store = await getStoreById(cart.storeId, conn);
  const totalPrice = items.reduce((sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 0), 0);
  const userPoints = await getUserPoints(userId, conn);
  return {
    storeId: cart.storeId,
    storeName: store?.storeName || null,
    minOrderAmount: Number(store?.minOrderAmount || 0),
    baseDeliveryFee: Number(store?.baseDeliveryFee || 0),
    totalPrice,
    userPoints,
  };
}

//=====================SQL Functions================================================

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
        sm.storeId AS storeId,
        sm.menuStatus AS menuStatus
     FROM cart_items ci
     JOIN storemenus sm ON sm.storeMenuId = ci.storeMenuId
     WHERE ci.cartId = ?`,
    [cartId],
  );
  return rows;
}

async function upsertCartItem(cartId, storeMenuId, quantity, conn) {
  const executor = withConn(conn);
  // 명세 요구: 서버는 최종 quantity로 set
  await executor.query(
    `INSERT INTO cart_items (cartId, storeMenuId, quantity)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
    [cartId, storeMenuId, quantity],
  );
}

async function setCartItemQuantity(cartId, storeMenuId, quantity, conn) {
  const executor = withConn(conn);
  const [result] = await executor.query(
    `UPDATE cart_items SET quantity = ? WHERE cartId = ? AND storeMenuId = ?`,
    [quantity, cartId, storeMenuId],
  );
  return result.affectedRows;
}

async function deleteCartItem(cartId, storeMenuId, conn) {
  const executor = withConn(conn);
  const [result] = await executor.query(
    `DELETE FROM cart_items WHERE cartId = ? AND storeMenuId = ?`,
    [cartId, storeMenuId],
  );
  return result.affectedRows;
}

async function deleteCartItemsBulk(cartId, storeMenuIds, conn) {
  const executor = withConn(conn);
  const placeholders = storeMenuIds.map(() => '?').join(',');
  const [result] = await executor.query(
    `DELETE FROM cart_items WHERE cartId = ? AND storeMenuId IN (${placeholders})`,
    [cartId, ...storeMenuIds],
  );
  return result.affectedRows;
}

async function clearCartItems(cartId, conn) {
  const executor = withConn(conn);
  await executor.query('DELETE FROM cart_items WHERE cartId = ?', [cartId]);
}

async function getStoreById(storeId, conn) {
  const executor = withConn(conn);
  const [rows] = await executor.query(
    'SELECT storeId, storeName, minOrderAmount, baseDeliveryFee, isActive FROM stores WHERE storeId = ? LIMIT 1',
    [storeId],
  );
  return rows[0] || null;
}

async function getUserPoints(userId, conn) {
  const executor = withConn(conn);
  const [rows] = await executor.query('SELECT userPoints FROM users WHERE userId = ? LIMIT 1', [userId]);
  return Number(rows[0]?.userPoints || 0);
}

module.exports = {
  getCart,
  addItem,
  forceAddItem,
  updateItemQuantity,
  removeItem,
  removeItemsBulk,
  clearCart,
  validateCart,
};
