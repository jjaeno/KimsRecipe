// Responsibility: 장바구니 도메인 규칙과 트랜잭션을 관리한다.
// Service가 하는 일:
// - 입력 검증 및 비즈니스 규칙(스토어 컨텍스트 일관성, 유저당 CART 1개) 확인
// - 트랜잭션 경계 설정(begin/commit/rollback) 및 실패 시 롤백
// - Repository 호출을 통한 SQL 실행
// Service가 하지 않는 일: HTTP 응답 작성, Express next 호출, DB 커넥션 풀 생성, 라우팅. 에러는 AppError로 throw하여 Controller/글로벌 핸들러가 처리.

const pool = require('../db/pool');
const { AppError } = require('../utils/errors');
const cartRepo = require('../repositories/cart.repo');
const storeRepo = require('../repositories/store.repo');

const isPosInt = (v) => Number.isInteger(Number(v)) && Number(v) > 0;

async function getCart(userId) {
  // 조회만 수행하며 트랜잭션 불필요. 없으면 빈 카트 형태 반환.
  const cart = await cartRepo.getCartByUser(userId);
  if (!cart) {
    return { cartId: null, storeId: null, items: [] };
  }
  const items = await cartRepo.getCartItemsWithMenu(cart.cartId);
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
  // 공통 트랜잭션 헬퍼: Service 내부에서만 사용. commit/rollback 책임을 이 함수가 가진다.
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
  // 비즈니스 규칙: 숫자 검증 -> 메뉴 존재/매장 일치 확인 -> CART 생성/확인 -> store 컨텍스트 충돌 검사(DIFFERENT_STORE 409) -> upsert
  if (!isPosInt(storeId) || !isPosInt(storeMenuId) || !isPosInt(quantity)) {
    throw new AppError(400, 'BAD_REQUEST', '숫자 값이 필요합니다.');
  }

  return withTransaction(async (conn) => {
    const menu = await storeRepo.findMenuById(storeMenuId, conn);
    if (!menu || Number(menu.storeId) !== Number(storeId)) {
      throw new AppError(400, 'BAD_REQUEST', '해당 매장의 메뉴가 아닙니다.');
    }

    let cart = await cartRepo.getCartByUser(userId, conn);
    let cartId;
    if (!cart) {
      cartId = await cartRepo.createCart(userId, storeId, conn);
    } else {
      cartId = cart.cartId;
      if (Number(cart.storeId) !== Number(storeId)) {
        const itemCount = await cartRepo.countCartItems(cartId, conn);
        if (itemCount > 0) {
          throw new AppError(409, 'DIFFERENT_STORE', '다른 매장 장바구니가 존재합니다. 초기화 후 다시 담아주세요.', {
            currentStoreId: Number(cart.storeId),
            currentItemCount: itemCount,
            requestedStoreId: Number(storeId),
          });
        }
        await cartRepo.updateCartStore(cartId, storeId, conn);
      }
    }

    await cartRepo.upsertCartItem(cartId, storeMenuId, quantity, conn);
    return { cartId, storeId: Number(storeId) };
  });
}

async function forceAddItem({ userId, storeId, storeMenuId, quantity }) {
  // 비즈니스 규칙: 다른 매장 아이템 강제 담기. 기존 cart_items 전부 삭제 후 storeId 전환, 이후 upsert.
  if (!isPosInt(storeId) || !isPosInt(storeMenuId) || !isPosInt(quantity)) {
    throw new AppError(400, 'BAD_REQUEST', '숫자 값이 필요합니다.');
  }

  return withTransaction(async (conn) => {
    const menu = await storeRepo.findMenuById(storeMenuId, conn);
    if (!menu || Number(menu.storeId) !== Number(storeId)) {
      throw new AppError(400, 'BAD_REQUEST', '해당 매장의 메뉴가 아닙니다.');
    }

    let cart = await cartRepo.getCartByUser(userId, conn);
    let cartId;
    if (!cart) {
      cartId = await cartRepo.createCart(userId, storeId, conn);
    } else {
      cartId = cart.cartId;
      // force: 기존 아이템 전부 삭제 후 store 전환
      await cartRepo.clearCartItems(cartId, conn);
      if (Number(cart.storeId) !== Number(storeId)) {
        await cartRepo.updateCartStore(cartId, storeId, conn);
      }
    }
    await cartRepo.upsertCartItem(cartId, storeMenuId, quantity, conn);
    return { cartId, storeId: Number(storeId) };
  });
}

async function updateItemQuantity({ userId, storeMenuId, quantity }) {
  // 비즈니스 규칙: CART 존재해야 하며, 없는 메뉴는 404. 수량은 양의 정수.
  if (!isPosInt(storeMenuId) || !isPosInt(quantity)) {
    throw new AppError(400, 'BAD_REQUEST', '숫자 값이 필요합니다.');
  }
  return withTransaction(async (conn) => {
    const cart = await cartRepo.getCartByUser(userId, conn);
    if (!cart) {
      throw new AppError(404, 'NOT_FOUND', '장바구니가 존재하지 않습니다.');
    }
    await cartRepo.setCartItemQuantity(cart.cartId, storeMenuId, quantity, conn);
    return { cartId: cart.cartId, storeId: cart.storeId };
  });
}

async function removeItem({ userId, storeMenuId }) {
  // 비즈니스 규칙: CART 존재 + 대상 메뉴 존재 여부 확인. 존재하지 않으면 404.
  if (!isPosInt(storeMenuId)) {
    throw new AppError(400, 'BAD_REQUEST', '숫자 값이 필요합니다.');
  }
  return withTransaction(async (conn) => {
    const cart = await cartRepo.getCartByUser(userId, conn);
    if (!cart) {
      throw new AppError(404, 'NOT_FOUND', '장바구니가 존재하지 않습니다.');
    }
    const affected = await cartRepo.deleteCartItem(cart.cartId, storeMenuId, conn);
    if (!affected) {
      throw new AppError(404, 'NOT_FOUND', '해당 메뉴가 장바구니에 없습니다.');
    }
    return { cartId: cart.cartId, storeId: cart.storeId };
  });
}

async function clearCart(userId) {
  // CART가 없으면 cleared=false, 있으면 cart_items 전부 삭제
  return withTransaction(async (conn) => {
    const cart = await cartRepo.getCartByUser(userId, conn);
    if (!cart) {
      return { cleared: false };
    }
    await cartRepo.clearCartItems(cart.cartId, conn);
    return { cleared: true };
  });
}

module.exports = {
  getCart,
  addItem,
  forceAddItem,
  updateItemQuantity,
  removeItem,
  clearCart,
};
