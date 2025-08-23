const express = require('express');
const router = express.Router();
const {authMiddleware} = require('../middleware/authMiddleware');
const pool = require('../db'); 


{/*----장바구니 조회----*/}
router.get('/getCart', authMiddleware, async(req, res) => {
    const userId = req.user.id; //jwt에서 추출된 유저 id
    try {
        const db = await pool.getConnection();
        try {
            //유저 id에 따른 cart 찾기
            const [cartRows] = await db.query(
                `SELECT cartId, storeId
                    FROM carts
                WHERE userId = ?
                LIMIT 1`,
            [userId]
            );
            //장바구니가 없으면 빈 배열 반환
            if (cartRows.length == 0) {
                db.release();
                return res.json({
                    success: true,
                    cartId: null,
                    storeId: null,
                    items: [],
                });
            }
            const {cartId, storeId} = cartRows[0];
            //아이템 + 메뉴 상세 조인
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
                [cartId]
            );
            db.release();
            return res.json({
                success: true,
                cartId,
                storeId,
                items: itemRows.map(r => ({
                    storeMenuId: String(r.storeMenuId), //메뉴 아이디
                    name: r.name,
                    description: r.description,
                    price: r.price,
                    amount: r.amount,
                    image: r.imageUrl,
                    quantity: r.quantity,
                    storeId: r.storeId //호점 아이디
                })),
            });
        } catch(err) {
            db.release();
            console.error(err);
            return res.status(500).json({success: false, message: 'DB 조회 중 오류가 발생했습니다.'});
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({success: false, message: 'DB 연결 중 오류가 발생했습니다.'})
    }
});
//양의 정수인지 체크
const isPosInt = v => Number.isInteger(Number(v)) && Number(v) > 0;

{/*----장바구니 항목 추가----*/}
router.post('/addCart', authMiddleware, async(req, res) => {
    const userId = req.user.id;
    const { storeId, storeMenuId, quantity } = req.body;

    //요청값 유효성 검사
    if (!isPosInt(storeId) || !isPosInt(storeMenuId) || !isPosInt(quantity)) {
        return res.status(400).json({success: false, message: '수량은 양수여야 합니다.'});
    }

    const db = await pool.getConnection();
    try {
        await db.beginTransaction(); //트랜잭션 -> 실패 시 롤백 가능
        //담으려는 메뉴가 그 매장의 메뉴가 맞는지 검증(데이터 무결성을 위함)
        const [menuRows] = await db.query(
            `SELECT storeMenuId FROM storemenus WHERE storeMenuId=? AND storeId=? LIMIT 1`,
            [storeMenuId, storeId]
        );
        if (menuRows.length === 0) {
            //매장-메뉴 불일치 -> 롤백 후 에러 응답
            await db.rollback(); db.release();
            return res.status(400).json({success: false, message: '해당 매장의 메뉴 정보가 존재하지 않습니다.'});
        }
        //유저 장바구니 조회
        const [cartRows] = await db.query(
            `SELECT cartId, storeId FROM carts WHERE userId=? LIMIT 1`,
            [userId]
        );
        let cartId;
        //유저 장바구니가 없으면 새로 생성
        if (cartRows.length === 0) {
            const [insert] = await db.query(
                `INSERT INTO carts (userId, storeId) VALUES(?, ?)`,
                [userId, storeId]
            );
            cartId = insert.insertId; //insertId는 db가 반환해주는 값중 하나
        } else {
            cartId = cartRows[0].cartId;

            //기존 장바구니의 매장이 요청한 매장과 다르면
            if (Number(cartRows[0].storeId) !== Number(storeId)) {
                //장바구니에 아이템이 있는지 확인
                const [[cnt]] = await db.query(
                    `SELECT COUNT(*) AS cnt FROM cart_items WHERE cartId=?`,
                    [cartId]
                );
                //다른 매장인데 장바구니에 아이템이 있으면
                if (cnt.cnt > 0) {
                    await db.rollback(); db.release();
                    return res.status(409).json({
                        success: false,
                        code: 'DIFFERENT_STORE',
                        message: '다른 매장의 장바구니가 있습니다. 초기화하고 담으시겠습니까?',
                        currentStoreId: Number(cartRows[0].storeId), //현재 장바구니의 매장
                        currentItemCount: cnt.cnt, //현재 장바구니 아이템의 개수
                        requestedStoreId: Number(storeId), //새로 담으려는 매장 id
                    });
                }
                //기존과 매장이 다르지만 아이템이 없다면 매장 교체 허용(db의 storeId 업데이트)
                await db.query(`UPDATE carts SET storeId=? WHERE cartId=?`, [storeId, cartId]);
            }
        }
        //장바구니 아이템 추가(있으면 수량 증가, 없으면 새로 추가 db의 UNIQUE 설계해둠)
        await db.query(
            `INSERT INTO cart_items (cartId, storeMenuId, quantity)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
            [cartId, storeMenuId, quantity]
        );
        await db.commit(); db.release();
        //최종 응답
        return res.json({
            success: true,
            message: '장바구니에 담겼습니다!',
            cartId,
            storeId: Number(storeId),
        });
    } catch (err) {
        console.error(err);
        try { await db.rollback(); } catch {}
        db.release();
        return res.status(500).json({success: false, message: '장바구니 추가 중 오류가 발생했습니다.'});
    }
});

{/*----장바구니 항목 삭제----*/}
router.delete('/remove', authMiddleware, async(req, res) => {
    const userId = req.user.id;
    const {storeMenuId} = req.body;

    if (!Number.isInteger(Number(storeMenuId)) || Number(storeMenuId) <= 0) {
        return res.status(400).json({success: false, message: '메뉴 id는 양수여야 합니다.'});
    }
    const db = await pool.getConnection();
    try {
        await db.beginTransaction();
        //유저의 cartId 찾기
        const [cartRows] = await db.query(
            `SELECT cartId FROM carts WHERE userId=? LIMIT 1`,
            [userId]
        );
        if (cartRows.length === 0) {
            await db.rollback(); db.release();
            return res.status(404).json({success: false, message: '장바구니가 없습니다.'});
        }

        const cartId = cartRows[0].cartId;
        const [result] = await db.query(
            `DELETE FROM cart_items WHERE cartId=? AND storeMenuId=?`,
            [cartId, storeMenuId]
        );

        await db.commit(); db.release();
        if (result.affectedRows === 0) {
            return res.status(404).json({success: false, message: '해당 메뉴가 장바구니에 없습니다.'});
        }

        return res.json({success: true, message: '항목 삭제 완료'});
    } catch (err) {
        console.error(err);
        try {await db.rollback();} catch{}
        db.release();
        return res.status(500).json({success: false, message: '항목 삭제 중 오류가 발생했습니다.'});
    }
});

{/*----장바구니 전체 삭제----*/}
router.delete('/clear', authMiddleware, async(req, res) => {
    const userId = req.user.id;
    const db = await pool.getConnection();
    try {
        await db.beginTransaction();
        const [cartRows] = await db.query(
            `SELECT cartId FROM carts WHERE userId=? LIMIT 1`,
            [userId]
        );
        if (cartRows.length === 0) {
            await db.rollback(); db.release();
            return res.json({ success: true, message: '이미 장바구니가 비어있습니다.'})
        }
        const cartId = cartRows[0].cartId;
        await db.query(
            `DELETE FROM cart_items WHERE cartId=?`,
            [cartId]
        );
        await db.commit(); db.release();
        return res.json({success: true, message: '장바구니를 비웠습니다.'});
    } catch(err) {
        console.error(err);
        try { await db.rollback();} catch{}
        db.release();
        return res.status(500).json({success: false, message: '장바구니 초기화 중 오류가 발생하였습니다.'});
    }
});

module.exports = router;