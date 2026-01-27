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

// GET /api/addresses/me
// 기본 배송지 조회
router.get('/addresses/me', auth, async (req, res, next) => {
  try {
    const result = await checkoutService.getMyAddress(req.user.id);
    return success(res, result, 'Default address fetched');
  } catch (err) {
    return next(err);
  }
});

// POST /api/addresses
// 배송지 생성
router.post('/addresses', auth, async (req, res, next) => {
  try {
    const result = await checkoutService.createAddress({
      userId: req.user.id,
      label: req.body.label,
      recipientName: req.body.recipientName,
      phone: req.body.phone,
      postalCode: req.body.postalCode,
      addressLine1: req.body.addressLine1,
      addressLine2: req.body.addressLine2,
      isDefault: req.body.isDefault,
    });
    return success(res, result, 'Address created');
  } catch (err) {
    return next(err);
  }
});

// PUT /api/addresses/:addressId
// 배송지 수정
router.put('/addresses/:addressId', auth, async (req, res, next) => {
  try {
    const result = await checkoutService.updateAddress({
      userId: req.user.id,
      addressId: Number(req.params.addressId),
      label: req.body.label,
      recipientName: req.body.recipientName,
      phone: req.body.phone,
      postalCode: req.body.postalCode,
      addressLine1: req.body.addressLine1,
      addressLine2: req.body.addressLine2,
      isDefault: req.body.isDefault,
    });
    return success(res, result, 'Address updated');
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
