const express = require('express'); 
const router = express.Router();    
const db = require('../db');      

// GET /api/stores/getAll — 전체 데이터 조회
router.get('/getAll', async (_req, res) => {
  try {
    // DB에서 상점-카테고리-메뉴를 LEFT JOIN으로 가져오기
    const sql = `
      SELECT
        s.storeId, s.storeName,
        c.categoryId, c.categoryName,
        m.storeMenuId, m.menuName, m.description, m.price, m.imageUrl, m.popularity, m.amount
      FROM stores s
      LEFT JOIN categories c
        ON c.storeId = s.storeId
      LEFT JOIN storemenus m
        ON m.storeId = s.storeId
       AND m.categoryId = c.categoryId
      ORDER BY s.storeId, c.categoryId, m.storeMenuId
    `;

    const [rows] = await db.query(sql); // 쿼리 실행

    const storesMap = new Map(); // 상점별 데이터 임시 저장용 Map

    // 행 데이터를 상점 → 카테고리 → 메뉴 구조로 변환
    for (const r of rows) {
      const sId = String(r.storeId);
      const cId = r.categoryId != null ? String(r.categoryId) : null;

      // 상점 없으면 생성
      if (!storesMap.has(sId)) {
        storesMap.set(sId, {
          storeObj: { storeId: sId, storeName: r.storeName, categories: [] },
          categoriesMap: new Map(),
        });
      }
      const s = storesMap.get(sId);

      // 카테고리 없으면 다음 행
      if (!cId) continue;

      // 카테고리 없으면 생성 후 상점에 추가
      if (!s.categoriesMap.has(cId)) {
        const cat = { categoryId: cId, categoryName: r.categoryName, items: [] };
        s.categoriesMap.set(cId, cat);
        s.storeObj.categories.push(cat);
      }
      const category = s.categoriesMap.get(cId);

      // 메뉴 없으면 다음 행
      if (r.storeMenuId == null) continue;

      // 메뉴 데이터 추가
      category.items.push({
        id: String(r.storeMenuId),
        name: r.menuName,
        description: r.description || '',
        price: Number(r.price),
        image: r.imageUrl,
        popularity: Number(r.popularity),
        amount: String(r.amount)
      });
    }

    // Map → 배열 변환
    const nested = Array.from(storesMap.values()).map(v => v.storeObj);

    res.set('Cache-Control', 'private, max-age=30'); // 캐시 설정
    res.json(nested); // 최종 응답
  } catch (err) {
    console.error('GET /api/stores/all error:', err); // 에러 로그
    res.status(500).json({ message: '서버 에러' }); // 에러 응답
  }
});

module.exports = router; // 라우터 내보내기
