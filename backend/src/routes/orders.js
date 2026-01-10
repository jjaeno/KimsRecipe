const express = require('express');
const ordersService = require('../services/orders.service');
const { success } = require('../utils/response');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Frontend endpoint examples (base: /api/v1):
// POST /api/v1/orders
// GET  /api/v1/orders
// GET  /api/v1/orders/:orderId

async function createOrder(req, res, next) {
  try {
    const { cartId } = req.body;
    const result = await ordersService.createOrderFromCart({ userId: req.user.id, cartId });
    return success(res, result, '주문 생성에 성공했습니다.', 'OK', 201);
  } catch (err) {
    return next(err);
  }
}

async function listOrders(req, res, next) {
  try {
    const orders = await ordersService.listOrders(req.user.id);
    return success(res, { orders }, '주문 목록 조회 성공');
  } catch (err) {
    return next(err);
  }
}

async function getOrderDetail(req, res, next) {
  try {
    const { orderId } = req.params;
    const result = await ordersService.getOrderDetail({ userId: req.user.id, orderId });
    return success(res, result, '주문 상세 조회 성공');
  } catch (err) {
    return next(err);
  }
}

router.post('/', auth, createOrder);
router.get('/', auth, listOrders);
router.get('/:orderId', auth, getOrderDetail);

module.exports = router;


