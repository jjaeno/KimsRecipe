const pool = require('../db/pool');
const { AppError } = require('../utils/errors');

const withConn = (conn) => conn || pool;

// 트랜잭션 헬퍼
async function withTransaction(fn) {
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

// 배송지 목록 조회
async function getAddresses(userId) {
  const [rows] = await pool.query(
    `SELECT addressId, userId, label, recipientName, phone, postalCode, addressLine1, addressLine2, isDefault, created_at, updated_at
     FROM addresses WHERE userId = ? ORDER BY isDefault DESC, addressId DESC`,
    [userId],
  );
  return { addresses: rows };
}

// 기본 배송지 조회
async function getMyAddress(userId) {
  const address = await getDefaultAddress(userId);
  return address || null;
}

// 배송지 생성
async function createAddress({ userId, label, recipientName, phone, postalCode, addressLine1, addressLine2, isDefault }) {
  return withTransaction(async (conn) => {
    if (Number(isDefault) === 1) {
      await conn.query(`UPDATE addresses SET isDefault = 0 WHERE userId = ?`, [userId]);
    }

    const [result] = await conn.query(
      `INSERT INTO addresses
        (userId, label, recipientName, phone, postalCode, addressLine1, addressLine2, isDefault)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        label || null,
        recipientName,
        phone,
        postalCode || null,
        addressLine1,
        addressLine2 || null,
        Number(isDefault) === 1 ? 1 : 0,
      ],
    );

    return await getAddressById(userId, result.insertId, conn);
  });
}

// 배송지 수정
async function updateAddress({ userId, addressId, label, recipientName, phone, postalCode, addressLine1, addressLine2, isDefault }) {
  return withTransaction(async (conn) => {
    const existing = await getAddressById(userId, addressId, conn);
    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', 'Address not found.');
    }

    if (Number(isDefault) === 1) {
      await conn.query(`UPDATE addresses SET isDefault = 0 WHERE userId = ? AND addressId != ?`, [userId, addressId]);
    }

    await conn.query(
      `UPDATE addresses
       SET label = ?, recipientName = ?, phone = ?, postalCode = ?, addressLine1 = ?, addressLine2 = ?, isDefault = ?
       WHERE userId = ? AND addressId = ?`,
      [
        label || null,
        recipientName,
        phone,
        postalCode || null,
        addressLine1,
        addressLine2 || null,
        Number(isDefault) === 1 ? 1 : 0,
        userId,
        addressId,
      ],
    );

    return await getAddressById(userId, addressId, conn);
  });
}

// 주문 생성 (cart -> order + order_items 스냅샷)
async function createOrder({ userId, deliveryRequest, addressId, pointsUsed }) {
  return withTransaction(async (conn) => {
    // 1) 배송지 조회 (기본값 우선)
    const address = addressId
      ? await getAddressById(userId, addressId, conn)
      : await getDefaultAddress(userId, conn);

    if (!address) {
      throw new AppError(404, 'NOT_FOUND', '배송지를 찾을 수 없습니다.');
    }

    // 2) cart + items 조회
    const cart = await getCartByUser(userId, conn);
    if (!cart) throw new AppError(404, 'NOT_FOUND', '장바구니가 없습니다.');

    const items = await getCartItemsWithMenu(cart.cartId, conn);
    if (items.length === 0) throw new AppError(400, 'INVALID_INPUT', '장바구니가 비어 있습니다.');

    // 3) 판매상태/가격 재검증
    const invalid = [];
    for (const it of items) {
      if (it.menuStatus !== 'ON_SALE') {
        invalid.push({ storeMenuId: it.storeMenuId, reason: it.menuStatus });
      }
    }
    if (invalid.length > 0) {
      throw new AppError(409, 'SOLD_OUT_ITEM', '구매할 수 없는 상품이 있습니다.', { items: invalid });
    }

    // 4) 요약 계산
    const store = await getStoreById(cart.storeId, conn);
    const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const deliveryFee = Number(store?.baseDeliveryFee || 0);
    const total = subtotal + deliveryFee;

    // 5) 포인트 검증 (3000 이상, 보유포인트 이하, 결제금액 이하)
    const user = await getUserForUpdate(userId, conn);
    if (pointsUsed > 0) {
      if (pointsUsed < 3000) throw new AppError(400, 'INVALID_INPUT', '포인트는 3000p 이상 사용 가능합니다.');
      if (pointsUsed > user.userPoints) throw new AppError(400, 'INVALID_INPUT', '보유 포인트를 초과했습니다.');
      if (pointsUsed > total) throw new AppError(400, 'INVALID_INPUT', '결제 금액보다 큰 포인트는 사용할 수 없습니다.');
    }

    // 6) 주문 생성 + 아이템 스냅샷
    const [orderResult] = await conn.query(
      `INSERT INTO orders
        (userId, storeId, status, deliveryRecipient, deliveryPhone, deliveryPostalCode, deliveryAddress1, deliveryAddress2,
         deliveryRequest, subtotalAmount, deliveryFee, pointsUsed, totalAmount)
       VALUES (?, ?, 'CREATED', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        cart.storeId,
        address.recipientName,
        address.phone,
        address.postalCode,
        address.addressLine1,
        address.addressLine2,
        deliveryRequest || '',
        subtotal,
        deliveryFee,
        pointsUsed,
        total - pointsUsed,
      ],
    );

    const orderId = orderResult.insertId;
    // 7) order_items 스냅샷 생성
    for (const it of items) {
      await conn.query(
        `INSERT INTO order_items
          (orderId, storeMenuId, menuName, menuStatus, price, quantity, imageUrl, amount)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [orderId, it.storeMenuId, it.menuName, it.menuStatus, it.price, it.quantity, it.imageUrl, it.amount],
      );
    }

    // 8) cart_items는 유지
    return {
      orderId,
      storeId: cart.storeId,
      subtotalAmount: subtotal,
      deliveryFee,
      pointsUsed,
      totalAmount: total - pointsUsed,
    };
  });
}

//결제 생성(READY 상태)
async function createPayment({ userId, orderId, method }) {
  return withTransaction(async (conn) => {
    const order = await getOrderById(userId, orderId, conn);
    if (!order) throw new AppError(404, 'NOT_FOUND', '주문을 찾을 수 없습니다.');
    if (order.status === 'PAID') throw new AppError(409, 'ALREADY_PAID', '이미 결제된 주문입니다.');

    const [result] = await conn.query(
      `INSERT INTO payments (orderId, userId, status, amount, method)
       VALUES (?, ?, 'READY', ?, ?)`,
      [orderId, userId, order.totalAmount, method],
    );

    return { paymentId: result.insertId, amount: order.totalAmount };
  });
}

// 결제 확정 (PAID/FAILED + 주문 확정 + cart_items 삭제 + 포인트 차감)
async function confirmPayment({ userId, paymentId, pgTransactionId, paidAmount }) {
  return withTransaction(async (conn) => {
    // payment 조회
    const payment = await getPaymentById(userId, paymentId, conn);
    if (!payment) throw new AppError(404, 'NOT_FOUND', '결제 정보를 찾을 수 없습니다.');

    // idempotent: 같은 pgTransactionId면 성공 반환
    if (payment.status === 'PAID' && payment.pgTransactionId === pgTransactionId) {
      return { paymentId, status: 'PAID' };
    }

    // 이미 결제 완료인데 다른 pgTransactionId면 충돌
    if (payment.status === 'PAID' && payment.pgTransactionId !== pgTransactionId) {
      throw new AppError(409, 'ALREADY_PAID', '이미 결제된 주문입니다.');
    }

    // amount 위변조 방지
    if (Number(paidAmount) !== Number(payment.amount)) {
      throw new AppError(409, 'PRICE_CHANGED', '결제 금액이 일치하지 않습니다.');
    }

    const order = await getOrderById(userId, payment.orderId, conn);
    if (!order) throw new AppError(404, 'NOT_FOUND', '주문을 찾을 수 없습니다.');

    // 주문 품목 재검증
    const orderItems = await getOrderItems(order.orderId, conn);
    const invalid = [];
    for (const it of orderItems) {
      const menu = await findMenuById(it.storeMenuId, conn);
      if (!menu || menu.menuStatus !== 'ON_SALE' || Number(menu.price) !== Number(it.price)) {
        invalid.push({ storeMenuId: it.storeMenuId, reason: 'PRICE_CHANGED' });
      }
    }
    if (invalid.length > 0) {
      await markPaymentFailed(paymentId, pgTransactionId, conn);
      throw new AppError(409, 'PRICE_CHANGED', '결제 검증 실패', { items: invalid });
    }

    // 포인트 차감 (FOR UPDATE)
    const user = await getUserForUpdate(userId, conn);
    if (order.pointsUsed > 0) {
      if (user.userPoints < order.pointsUsed) {
        await markPaymentFailed(paymentId, pgTransactionId, conn);
        throw new AppError(409, 'INVALID_INPUT', '포인트가 부족합니다.');
      }
      await conn.query(
        `UPDATE users SET userPoints = userPoints - ? WHERE userId = ?`,
        [order.pointsUsed, userId],
      );
    }

    // 결제/주문 확정
    await conn.query(
      `UPDATE payments SET status = 'PAID', pgTransactionId = ? WHERE paymentId = ?`,
      [pgTransactionId, paymentId],
    );
    await conn.query(
      `UPDATE orders SET status = 'PAID' WHERE orderId = ?`,
      [order.orderId],
    );

    // 해당 주문 품목만 cart_items에서 삭제
    const storeMenuIds = orderItems.map((it) => it.storeMenuId);
    if (storeMenuIds.length > 0) {
      const placeholders = storeMenuIds.map(() => '?').join(',');
      await conn.query(
        `DELETE ci FROM cart_items ci
         JOIN carts c ON c.cartId = ci.cartId
         WHERE c.userId = ? AND ci.storeMenuId IN (${placeholders})`,
        [userId, ...storeMenuIds],
      );
    }

    return { paymentId, status: 'PAID', orderId: order.orderId };
  });
}

// =======SQL 헬퍼=======
async function getCartByUser(userId, conn) {
  const executor = withConn(conn);
  const [rows] = await executor.query('SELECT cartId, storeId FROM carts WHERE userId = ? LIMIT 1', [userId]);
  return rows[0] || null;
}

async function getCartItemsWithMenu(cartId, conn) {
  const executor = withConn(conn);
  const [rows] = await executor.query(
    `SELECT ci.storeMenuId, ci.quantity, sm.menuName, sm.price, sm.imageUrl, sm.amount, sm.menuStatus
     FROM cart_items ci JOIN storemenus sm ON sm.storeMenuId = ci.storeMenuId
     WHERE ci.cartId = ?`,
    [cartId],
  );
  return rows;
}

async function getStoreById(storeId, conn) {
  const executor = withConn(conn);
  const [rows] = await executor.query(
    'SELECT storeId, baseDeliveryFee FROM stores WHERE storeId = ? LIMIT 1',
    [storeId],
  );
  return rows[0] || null;
}

async function getUserForUpdate(userId, conn) {
  const executor = withConn(conn);
  const [[row]] = await executor.query(
    'SELECT userId, userPoints FROM users WHERE userId = ? FOR UPDATE',
    [userId],
  );
  return row;
}

async function getDefaultAddress(userId, conn) {
  const executor = withConn(conn);
  const [rows] = await executor.query(
    `SELECT * FROM addresses WHERE userId = ? ORDER BY isDefault DESC, addressId DESC LIMIT 1`,
    [userId],
  );
  return rows[0] || null;
}

async function getAddressById(userId, addressId, conn) {
  const executor = withConn(conn);
  const [rows] = await executor.query(
    `SELECT * FROM addresses WHERE userId = ? AND addressId = ? LIMIT 1`,
    [userId, addressId],
  );
  return rows[0] || null;
}

async function getOrderById(userId, orderId, conn) {
  const executor = withConn(conn);
  const [rows] = await executor.query(
    `SELECT * FROM orders WHERE orderId = ? AND userId = ? LIMIT 1`,
    [orderId, userId],
  );
  return rows[0] || null;
}

async function getOrderItems(orderId, conn) {
  const executor = withConn(conn);
  const [rows] = await executor.query(
    `SELECT * FROM order_items WHERE orderId = ?`,
    [orderId],
  );
  return rows;
}

async function getPaymentById(userId, paymentId, conn) {
  const executor = withConn(conn);
  const [rows] = await executor.query(
    `SELECT * FROM payments WHERE paymentId = ? AND userId = ? LIMIT 1`,
    [paymentId, userId],
  );
  return rows[0] || null;
}

async function markPaymentFailed(paymentId, pgTransactionId, conn) {
  await conn.query(
    `UPDATE payments SET status = 'FAILED', pgTransactionId = ? WHERE paymentId = ?`,
    [pgTransactionId, paymentId],
  );
}

async function findMenuById(storeMenuId, conn) {
  const executor = withConn(conn);
  const [rows] = await executor.query(
    'SELECT * FROM storemenus WHERE storeMenuId = ? LIMIT 1',
    [storeMenuId],
  );
  return rows[0] || null;
}

module.exports = {
  getAddresses,
  getMyAddress,
  createAddress,
  updateAddress,
  createOrder,
  createPayment,
  confirmPayment,
};
