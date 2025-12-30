//v1 주문 라우트 정의 . 주문 생성, 조회 기능 제공.

const express = require('express');
const controller = require('../../controllers/orders.controller');
const { auth } = require('../../middleware/auth');

const router = express.Router();

// 주문 생성
router.post('/', auth, controller.createOrder);

// 주문 목록 조회
router.get('/', auth, controller.listOrders);

// 주문 상세 조회
router.get('/:orderId', auth, controller.getOrderDetail);

module.exports = router;
