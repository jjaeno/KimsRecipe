// Responsibility: 찜(wishlist) 도메인 규칙 및 SQL 실행을 담당한다.
// - 입력 검증, 목록 조회, 추가/삭제 처리
// - HTTP 응답 작성/라우팅은 하지 않는다.

const pool = require('../db/pool');
const { AppError, errorFactory } = require('../utils/errors');

const isPosInt = (v) => Number.isInteger(Number(v)) && Number(v) > 0;
const withConn = (conn) => conn || pool;

async function getWishlist(userId) {
  const rows = await listWishlistItems(userId);
  return {
    totalCount: rows.length,
    items: rows.map((row) => ({
      wishlistId: row.wishlistId,
      storeMenuId: String(row.storeMenuId),
      menuName: row.menuName,
      price: Number(row.price),
      imageUrl: row.imageUrl,
      amount: row.amount,
      menuStatus: row.menuStatus,
      storeId: String(row.storeId),
      createdAt: row.createdAt,
    })),
  };
}

async function addWishlistItem({ userId, storeMenuId }) {
  if (!isPosInt(storeMenuId)) {
    throw new AppError(400, 'INVALID_INPUT', 'storeMenuId가 올바르지 않습니다.');
  }

  const menu = await findMenuById(storeMenuId);
  if (!menu) {
    throw errorFactory.notFound('해당 메뉴를 찾을 수 없습니다.');
  }

  const inserted = await insertWishlist(userId, storeMenuId);
  return { storeMenuId: String(storeMenuId), added: inserted };
}

async function removeWishlistItem({ userId, storeMenuId }) {
  if (!isPosInt(storeMenuId)) {
    throw new AppError(400, 'INVALID_INPUT', 'storeMenuId가 올바르지 않습니다.');
  }
  const removed = await deleteWishlist(userId, storeMenuId);
  return { storeMenuId: String(storeMenuId), removed: removed > 0 };
}

//=====================SQL Functions================================================

async function listWishlistItems(userId, conn) {
  const executor = withConn(conn);
  const [rows] = await executor.query(
    `SELECT
        w.wishlistId,
        w.storeMenuId,
        w.created_at AS createdAt,
        sm.menuName AS menuName,
        sm.price AS price,
        sm.imageUrl AS imageUrl,
        sm.amount AS amount,
        sm.menuStatus AS menuStatus,
        sm.storeId AS storeId
     FROM wishlists w
     JOIN storemenus sm ON sm.storeMenuId = w.storeMenuId
     WHERE w.userId = ?
       AND sm.menuStatus <> 'HIDDEN'
     ORDER BY w.created_at DESC`,
    [userId],
  );
  return rows;
}

async function insertWishlist(userId, storeMenuId, conn) {
  const executor = withConn(conn);
  const [result] = await executor.query(
    'INSERT IGNORE INTO wishlists (userId, storeMenuId) VALUES (?, ?)',
    [userId, storeMenuId],
  );
  return result.affectedRows > 0;
}

async function deleteWishlist(userId, storeMenuId, conn) {
  const executor = withConn(conn);
  const [result] = await executor.query(
    'DELETE FROM wishlists WHERE userId = ? AND storeMenuId = ?',
    [userId, storeMenuId],
  );
  return result.affectedRows;
}

async function findMenuById(storeMenuId, conn) {
  const executor = withConn(conn);
  const [rows] = await executor.query(
    'SELECT storeMenuId FROM storemenus WHERE storeMenuId = ? LIMIT 1',
    [storeMenuId],
  );
  return rows[0] || null;
}

module.exports = {
  getWishlist,
  addWishlistItem,
  removeWishlistItem,
};
