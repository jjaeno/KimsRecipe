// Responsibility: 레거시 장바구니 라우터. 기존 프론트 의존 경로(/api/cart/*)를 그대로 유지하며, 트랜잭션/도메인 규칙을 라우트 내부에서 직접 처리한다. v1에서는 Service/Repository로 분리했지만 여기서는 동작 호환성을 최우선으로 한다.

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const pool = require('../db');

{/*----장바구니 조회----*/}
router.get('/getCart', authMiddleware, async (req, res) => {
  const userId = req.user.id; // JWT에서 추출한 사용자 id
  try {
    const db = await pool.getConnection();
    try {
      // 트랜잭션 없이 단순 조회: 유저당 cart 1개 규칙에 따라 1건만 조회
      const [cartRows] = await db.query(
        `SELECT cartId, storeId
                    FROM carts
                WHERE userId = ?
                LIMIT 1`,
        [userId],
      );
      // 장바구니가 없으면 빈 배열 반환
      if (cartRows.length == 0) {
        db.release();
        return res.json({
          success: true,
          cartId: null,
          storeId: null,
          items: [],
        });
      }
      const { cartId, storeId } = cartRows[0];
      // cart_items + storemenus 조합으로 장바구니 아이템 목록 조회
      const [itemRows] = await db.query(
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
      db.release();
      return res.json({
        success: true,
        cartId,
        storeId,
        items: itemRows.map((r) => ({
          storeMenuId: String(r.storeMenuId), // 메뉴 id 문자열화
          name: r.name,
          description: r.description,
          price: r.price,
          amount: r.amount,
          image: r.imageUrl,
          quantity: r.quantity,
          storeId: r.storeId, // storeId 컨텍스트 유지
        })),
      });
    } catch (err) {
      db.release();
      console.error(err);
      return res.status(500).json({ success: false, message: 'DB 조회 오류가 발생했습니다.' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'DB 연결 오류가 발생했습니다.' });
  }
});

// 양의 정수인지 체크(legacy 입력 검증 유틸)
const isPosInt = (v) => Number.isInteger(Number(v)) && Number(v) > 0;

{/*----장바구니 항목 추가----*/}
router.post('/addCart', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { storeId, storeMenuId, quantity } = req.body;

  // 요청값 유효성 검사: 모든 값이 양의 정수인지 확인
  if (!isPosInt(storeId) || !isPosInt(storeMenuId) || !isPosInt(quantity)) {
    return res.status(400).json({ success: false, message: '수량은 양수여야 합니다.' });
  }

  const db = await pool.getConnection();
  try {
    // 트랜잭션 경계: begin -> 모든 검증/insert -> commit, 실패 시 rollback
    await db.beginTransaction();
    // 담으려는 메뉴가 해당 매장의 메뉴가 맞는지 검증(데이터 무결성)
    const [menuRows] = await db.query(
      `SELECT storeMenuId FROM storemenus WHERE storeMenuId=? AND storeId=? LIMIT 1`,
      [storeMenuId, storeId],
    );
    if (menuRows.length === 0) {
      await db.rollback();
      db.release();
      return res.status(400).json({ success: false, message: '해당 매장의 메뉴 정보가 존재하지 않습니다.' });
    }
    // 유저 장바구니 조회: 유저당 CART 1개 규칙
    const [cartRows] = await db.query(
      `SELECT cartId, storeId FROM carts WHERE userId=? LIMIT 1`,
      [userId],
    );
    let cartId;
    // 장바구니가 없으면 새로 생성 (storeId 컨텍스트 부여)
    if (cartRows.length === 0) {
      const [insert] = await db.query(
        `INSERT INTO carts (userId, storeId) VALUES(?, ?)`,
        [userId, storeId],
      );
      cartId = insert.insertId; // DB가 반환한 cartId
    } else {
      cartId = cartRows[0].cartId;

      // 기존 장바구니의 storeId와 다른 매장 아이템을 담으려는 경우 컨텍스트 충돌 검사
      if (Number(cartRows[0].storeId) !== Number(storeId)) {
        const [[cnt]] = await db.query(
          `SELECT COUNT(*) AS cnt FROM cart_items WHERE cartId=?`,
          [cartId],
        );
        // 다른 매장인데 아이템이 있으면 409 + code=DIFFERENT_STORE 반환
        if (cnt.cnt > 0) {
          await db.rollback();
          db.release();
          return res.status(409).json({
            success: false,
            code: 'DIFFERENT_STORE',
            message: '다른 매장의 장바구니가 있습니다. 초기화하고 담으시겠습니까?',
            currentStoreId: Number(cartRows[0].storeId), // 현재 장바구니의 매장
            currentItemCount: cnt.cnt, // 현재 장바구니 아이템의 개수
            requestedStoreId: Number(storeId), // 새로 담으려는 매장 id
          });
        }
        // 아이템이 없다면 storeId만 교체 허용
        await db.query(`UPDATE carts SET storeId=? WHERE cartId=?`, [storeId, cartId]);
      }
    }
    // 장바구니 아이템 추가/증가 (UNIQUE 제약 활용한 upsert)
    await db.query(
      `INSERT INTO cart_items (cartId, storeMenuId, quantity)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
      [cartId, storeMenuId, quantity],
    );
    await db.commit();
    db.release();
    // 최종 응답: legacy 포맷 유지
    return res.json({
      success: true,
      message: '장바구니에 담겼습니다!',
      cartId,
      storeId: Number(storeId),
    });
  } catch (err) {
    console.error(err);
    try {
      await db.rollback();
    } catch {}
    db.release();
    return res.status(500).json({ success: false, message: '장바구니 추가 중 오류가 발생했습니다.' });
  }
});

{/*----장바구니 항목 삭제----*/}
router.delete('/remove', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { storeMenuId } = req.body;

  // 입력 검증: storeMenuId는 양의 정수
  if (!Number.isInteger(Number(storeMenuId)) || Number(storeMenuId) <= 0) {
    return res.status(400).json({ success: false, message: '메뉴 id는 양수여야 합니다.' });
  }
  const db = await pool.getConnection();
  try {
    // 트랜잭션: cart 존재 확인 -> delete -> commit
    await db.beginTransaction();
    // 유저의 cartId 찾기 (유저당 cart 1개)
    const [cartRows] = await db.query(
      `SELECT cartId FROM carts WHERE userId=? LIMIT 1`,
      [userId],
    );
    if (cartRows.length === 0) {
      await db.rollback();
      db.release();
      return res.status(404).json({ success: false, message: '장바구니가 없습니다.' });
    }

    const cartId = cartRows[0].cartId;
    const [result] = await db.query(
      `DELETE FROM cart_items WHERE cartId=? AND storeMenuId=?`,
      [cartId, storeMenuId],
    );

    await db.commit();
    db.release();
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: '해당 메뉴가 장바구니에 없습니다.' });
    }

    return res.json({ success: true, message: '항목 삭제 완료' });
  } catch (err) {
    console.error(err);
    try {
      await db.rollback();
    } catch {}
    db.release();
    return res.status(500).json({ success: false, message: '항목 삭제 중 오류가 발생했습니다.' });
  }
});

{/*----장바구니 전체 초기화----*/}
router.delete('/clear', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const db = await pool.getConnection();
  try {
    // 트랜잭션: cart 존재 확인 -> cart_items 삭제 -> commit
    await db.beginTransaction();
    const [cartRows] = await db.query(
      `SELECT cartId FROM carts WHERE userId=? LIMIT 1`,
      [userId],
    );
    if (cartRows.length === 0) {
      await db.rollback();
      db.release();
      return res.json({ success: true, message: '현재 장바구니가 비어있습니다.' });
    }
    const cartId = cartRows[0].cartId;
    await db.query(
      `DELETE FROM cart_items WHERE cartId=?`,
      [cartId],
    );
    await db.commit();
    db.release();
    return res.json({ success: true, message: '장바구니를 비웠습니다.' });
  } catch (err) {
    console.error(err);
    try {
      await db.rollback();
    } catch {}
    db.release();
    return res.status(500).json({ success: false, message: '장바구니 초기화 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
