//v1 장바구니 라우트 정의. 장바구니 조회, 담기, 수정, 삭제 기능을 제공

const express = require('express');
const controller = require('../../controllers/cart.controller');
const { auth } = require('../../middleware/auth');

const router = express.Router();

// 장바구니 조회
router.get('/', auth, controller.getCart);

// 장바구니 담기
router.post('/items', auth, controller.addItem);

// 다른 매장 아이템 강제 담기 (기존 카트 비우기)
router.post('/items/force', auth, controller.forceAddItem);

// 수량 변경
router.patch('/items/:storeMenuId', auth, controller.updateItem);

// 아이템 삭제
router.delete('/items/:storeMenuId', auth, controller.removeItem);

// 장바구니 전체 비우기
router.delete('/', auth, controller.clearCart);

module.exports = router;
