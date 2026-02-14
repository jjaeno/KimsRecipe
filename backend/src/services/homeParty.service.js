// Responsibility: 홈파티 예약 도메인 로직. 필수값 검증 및 DB 트랜잭션을 수행한다.

const pool = require('../db/pool');
const { AppError } = require('../utils/errors');

const withConn = (conn) => conn || pool;

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

function normalizeItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError(400, 'INVALID_INPUT', '메뉴 구성이 비어 있습니다.');
  }
  const map = new Map();
  for (const item of items) {
    const hpMenuId = String(item.hpMenuId || '').trim();
    const quantity = Number(item.quantity);
    if (!hpMenuId) {
      throw new AppError(400, 'INVALID_INPUT', '메뉴 ID가 필요합니다.');
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new AppError(400, 'INVALID_INPUT', '수량은 1 이상이어야 합니다.');
    }
    map.set(hpMenuId, (map.get(hpMenuId) || 0) + quantity);
  }
  return Array.from(map.entries()).map(([hpMenuId, quantity]) => ({ hpMenuId, quantity }));
}

async function createReservation(userId, payload) {
  const {
    storeId,
    eventType,
    headcount,
    budgetMin,
    budgetMax,
    eventDateTime,
    pickupDateTime,
    sourceType,
    baseSetId,
    requestNote,
    items,
  } = payload;

  if (!storeId || !eventType || !eventDateTime || !headcount) {
    throw new AppError(400, 'INVALID_INPUT', '필수 예약 정보가 누락되었습니다.');
  }

  const normalizedItems = normalizeItems(items);

  return withTransaction(async (conn) => {
    const menuRows = await getMenusByIdsInternal(normalizedItems.map((item) => item.hpMenuId), conn, storeId);
    const menuMap = new Map(menuRows.map((row) => [String(row.hpMenuId), row]));

    const invalid = [];
    for (const item of normalizedItems) {
      const menu = menuMap.get(String(item.hpMenuId));
      if (!menu) {
        invalid.push({ hpMenuId: item.hpMenuId, reason: 'NOT_FOUND' });
        continue;
      }
      if (menu.menuStatus !== 'ON_SALE') {
        invalid.push({ hpMenuId: item.hpMenuId, reason: menu.menuStatus });
      }
    }

    if (invalid.length > 0) {
      throw new AppError(409, 'SOLD_OUT_ITEM', '판매 중인 메뉴가 아닙니다.', { items: invalid });
    }

    const snapshots = normalizedItems.map((item) => {
      const menu = menuMap.get(String(item.hpMenuId));
      const unitPrice = Number(menu.price);
      const lineTotal = unitPrice * item.quantity;
      return {
        hpMenuId: Number(menu.hpMenuId),
        quantity: item.quantity,
        unitPrice,
        lineTotal,
        menuNameSnapshot: menu.menuName,
        imageUrlSnapshot: menu.imageUrl || null,
      };
    });

    const totalAmount = snapshots.reduce((sum, it) => sum + it.lineTotal, 0);
    const depositAmount = 0;

    const [reservationResult] = await conn.query(
      `INSERT INTO home_party_reservations
        (userId, storeId, status, eventType, headcount, budgetMin, budgetMax, eventDateTime, pickupDateTime,
         sourceType, baseSetId, requestNote, totalAmount, depositAmount)
       VALUES (?, ?, 'DRAFT', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ,
      [
        userId,
        storeId,
        eventType,
        headcount,
        budgetMin || null,
        budgetMax || null,
        eventDateTime,
        pickupDateTime || eventDateTime,
        sourceType || 'CUSTOM',
        baseSetId || null,
        requestNote || '',
        totalAmount,
        depositAmount,
      ],
    );

    const reservationId = reservationResult.insertId;

    for (const snapshot of snapshots) {
      await conn.query(
        `INSERT INTO home_party_reservation_items
          (reservationId, hpMenuId, quantity, unitPrice, lineTotal, menuNameSnapshot, imageUrlSnapshot)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
        ,
        [
          reservationId,
          snapshot.hpMenuId,
          snapshot.quantity,
          snapshot.unitPrice,
          snapshot.lineTotal,
          snapshot.menuNameSnapshot,
          snapshot.imageUrlSnapshot,
        ],
      );
    }

    await conn.query(
      `INSERT INTO home_party_reservation_status_logs
        (reservationId, fromStatus, toStatus, actorType)
       VALUES (?, ?, 'DRAFT', 'USER')`
      ,
      [reservationId, null],
    );

    return {
      reservationId,
      totalAmount,
      depositAmount,
      items: snapshots,
    };
  });
}

async function listReservations(userId) {
  return listReservationsByUser(userId);
}

async function getReservation(userId, reservationId) {
  const reservation = await getReservationById(reservationId, userId);
  if (!reservation) {
    throw new AppError(404, 'NOT_FOUND', '예약을 찾을 수 없습니다.');
  }
  return reservation;
}

async function getRecommendedSet(storeId, eventType, headcount, conn) {
  const executor = withConn(conn);
  // 세트 조회
  let [sets] = await executor.query(
    `SELECT setId, setName, imageUrl, basePrice, recommendedMinHeadcount, recommendedMaxHeadcount
     FROM home_party_sets
     WHERE storeId = ? AND status = 'ACTIVE'
       AND recommendedMinHeadcount <= ? AND recommendedMaxHeadcount >= ?
     ORDER BY setId ASC`,
    [storeId, headcount, headcount],
  );

  // 추천 세트가 없으면 전체 세트 중에서 조회
  if (!sets.length) {
    [sets] = await executor.query(
      `SELECT setId, setName, imageUrl, basePrice, recommendedMinHeadcount, recommendedMaxHeadcount
       FROM home_party_sets
       WHERE storeId = ? AND status = 'ACTIVE'
       ORDER BY setId ASC`,
      [storeId],
    );
  }

  if (!sets.length) return [];

  const setIds = sets.map((set) => set.setId);
  // 세트 아이템 조회
  const [items] = await executor.query(
    `SELECT hpsi.setId, hpsi.hpMenuId, hpm.menuName, hpm.price, hpm.imageUrl, hpsi.quantity
     FROM home_party_set_items hpsi
     JOIN home_party_menus hpm ON hpm.hpMenuId = hpsi.hpMenuId
     WHERE hpsi.setId IN (?)`,
    [setIds],
  );

  const itemsBySetId = items.reduce((acc, item) => {
    (acc[item.setId] ||= []).push(item);
    return acc;
  }, {});

  return sets.map((set) => ({
    ...set,
    items: itemsBySetId[set.setId] || [],
  }));
}

async function getCategories(storeId, conn) {
  const executor = withConn(conn);
  const [rows] = await executor.query(
    `SELECT hpCategoryId, categoryName
     FROM home_party_categories
     WHERE storeId = ? AND isVisible = 1
     ORDER BY sortOrder ASC`,
    [storeId],
  );
  return rows;
}

async function getMenus({ storeId, hpCategoryId, q }, conn) {
  const executor = withConn(conn);
  const conditions = ['storeId = ?', "menuStatus != 'HIDDEN'"];
  const params = [storeId];

  if (hpCategoryId) {
    conditions.push('hpCategoryId = ?');
    params.push(hpCategoryId);
  }

  if (q) {
    conditions.push('menuName LIKE ?');
    params.push(`%${q}%`);
  }

  const [rows] = await executor.query(
    `SELECT hpMenuId, menuName, price, imageUrl, amount, menuStatus, hpCategoryId
     FROM home_party_menus
     WHERE ${conditions.join(' AND ')}
     ORDER BY hpMenuId ASC`,
    params,
  );

  return rows;
}

async function getMenusByIds(ids, conn) {
  if (!ids || ids.length === 0) return [];
  return getMenusByIdsInternal(ids, conn);
}

async function getMenusByIdsInternal(ids, conn, storeId) {
  const executor = withConn(conn);
  const params = [ids];
  const storeFilter = storeId ? ' AND storeId = ?' : '';
  if (storeId) params.push(storeId);
  const [rows] = await executor.query(
    `SELECT hpMenuId, menuName, price, imageUrl, amount, menuStatus, hpCategoryId
     FROM home_party_menus
     WHERE hpMenuId IN (?)${storeFilter}`,
    params,
  );
  return rows;
}

async function listReservationsByUser(userId, conn) {
  const executor = withConn(conn);
  const [rows] = await executor.query(
    `SELECT reservationId, userId, storeId, status, eventType, eventDateTime, headcount,
            budgetMin, budgetMax, totalAmount, depositAmount, sourceType, baseSetId, created_at
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
    `SELECT reservationId, userId, storeId, status, eventType, eventDateTime, headcount,
            budgetMin, budgetMax, totalAmount, depositAmount, sourceType, baseSetId, requestNote, created_at
     FROM home_party_reservations
     WHERE reservationId = ? AND userId = ?
     LIMIT 1`,
    [reservationId, userId],
  );
  if (rows.length === 0) return null;

  const [items] = await executor.query(
    `SELECT reservationItemId, hpMenuId, quantity, unitPrice, lineTotal, menuNameSnapshot, imageUrlSnapshot
     FROM home_party_reservation_items
     WHERE reservationId = ?`,
    [reservationId],
  );

  return { ...rows[0], items };
}

module.exports = {
  createReservation,
  listReservations,
  getReservation,
  getRecommendedSet,
  getCategories,
  getMenus,
  getMenusByIds,
};
