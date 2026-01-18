const express = require('express');
const { auth } = require('../middleware/auth');
const { success } = require('../utils/response');
const checkoutService = require('../services/checkout.service');

const router = express.Router();


// GET /api/addresses
// 사용자의 배송지 조회
router.get('/addresses', auth, async (req, res, next) => {
  try {
    const result = await checkoutService.getAddresses(req.user.id);
    return success(res, result, '배송지 조회 성공');
  } catch (err) {
    return next(err);
  }
});


// POST /api/orders
// 주문 생성
router.post('/orders', auth, async (req, res, next) => {
  try {
    const result = await checkoutService.createOrder({
      userId: req.user.id,
      deliveryRequest: req.body.deliveryRequest || '',
      addressId: req.body.addressId,
      pointsUsed: req.body.pointsUsed || 0,
    });
    return success(res, result, '주문 생성 성공');
  } catch (err) {
    return next(err);
  }
});

// POST /api/payments
// 결제 생성
router.post('/payments', auth, async (req, res, next) => {
  try {
    const result = await checkoutService.createPayment({
      userId: req.user.id,
      orderId: req.body.orderId,
      method: req.body.method,
    });
    return success(res, result, '결제 생성 성공');
  } catch (err) {
    return next(err);
  }
});

// POST /api/payments/:paymentId/confirm
// 결제 확정
router.post('/payments/:paymentId/confirm', auth, async (req, res, next) => {
  try {
    const result = await checkoutService.confirmPayment({
      userId: req.user.id,
      paymentId: req.params.paymentId,
      pgTransactionId: req.body.pgTransactionId,
      paidAmount: req.body.paidAmount,
    });
    return success(res, result, '결제 확정 성공');
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
