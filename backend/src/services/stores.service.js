// Responsibility: 매장/카테고리/메뉴 조회 도메인 로직을 처리한다. SQL 호출은 Repository에 위임하고, 응답 포맷에 맞게 데이터 구조를 가공한다.
// 하지 않는 일: HTTP 응답 작성, 라우팅, 트랜잭션 관리(단순 조회라 불필요).


const pool = require('../db/pool');

async function getAllStores() {
  // legacy 쿼리 결과(raw rows)를 v1 응답용 중첩 구조로 가공
  const rows = await fetchStoresWithMenus();
  const storesMap = new Map();

  for (const r of rows) {
    const sId = String(r.storeId);
    const cId = r.categoryId != null ? String(r.categoryId) : null;

    if (!storesMap.has(sId)) {
      storesMap.set(sId, {
        storeObj: { storeId: sId, storeName: r.storeName, categories: [] },
        categoriesMap: new Map(),
      });
    }
    const s = storesMap.get(sId);

    if (!cId) continue;
    if (!s.categoriesMap.has(cId)) {
      const cat = { categoryId: cId, categoryName: r.categoryName, items: [] };
      s.categoriesMap.set(cId, cat);
      s.storeObj.categories.push(cat);
    }
    const category = s.categoriesMap.get(cId);

    if (r.storeMenuId == null) continue;
    category.items.push({
      id: String(r.storeMenuId),
      name: r.menuName,
      description: r.description || '',
      price: Number(r.price),
      image: r.imageUrl,
      popularity: Number(r.popularity),
      amount: String(r.amount),
    });
  }

  return Array.from(storesMap.values()).map((v) => v.storeObj);
}


const withConn = (conn) => conn || pool;

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

module.exports = { getAllStores };


