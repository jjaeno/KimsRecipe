// Responsibility: 매장/카테고리/메뉴 조회 도메인 로직을 처리한다. SQL 호출은 Repository에 위임하고, 응답 포맷에 맞게 데이터 구조를 가공한다.
// 하지 않는 일: HTTP 응답 작성, 라우팅, 트랜잭션 관리(단순 조회라 불필요).

const storeRepo = require('../repositories/store.repo');

async function getAllStores() {
  // legacy 쿼리 결과(raw rows)를 v1 응답용 중첩 구조로 가공
  const rows = await storeRepo.fetchStoresWithMenus();
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

module.exports = { getAllStores };
