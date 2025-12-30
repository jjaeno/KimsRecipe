// Responsibility: 매장/카테고리/메뉴 조회 SQL 전담. 데이터 가공이나 응답 포맷 변환은 Service에서 수행한다.
// 하지 말아야 할 것: 비즈니스 규칙 판단, 응답 포맷 구성, 트랜잭션 commit/rollback.

const pool = require('../db/pool');
const withConn = (conn) => conn || pool;

// 기존 legacy 쿼리를 재사용하여 nested 데이터를 만들기 위한 raw rows 반환
async function fetchStoresWithMenus(conn) {
  const executor = withConn(conn);
  const sql = `
    SELECT
      s.storeId, s.storeName,
      c.categoryId, c.categoryName,
      m.storeMenuId, m.menuName, m.description, m.price, m.imageUrl, m.popularity, m.amount, m.storeId AS menuStoreId
    FROM stores s
    LEFT JOIN categories c
      ON c.storeId = s.storeId
    LEFT JOIN storemenus m
      ON m.storeId = s.storeId
     AND m.categoryId = c.categoryId
    ORDER BY s.storeId, c.categoryId, m.storeMenuId
  `;
  const [rows] = await executor.query(sql);
  return rows;
}

async function findMenuById(storeMenuId, conn) {
  // 단일 메뉴 조회 (장바구니/메뉴 상세에서 사용)
  const executor = withConn(conn);
  const [rows] = await executor.query('SELECT * FROM storemenus WHERE storeMenuId = ? LIMIT 1', [storeMenuId]);
  return rows[0] || null;
}

module.exports = {
  fetchStoresWithMenus,
  findMenuById,
};
