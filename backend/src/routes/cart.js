const express = require('express');
const cartService = require('../services/cart.service');
const { success } = require('../utils/response');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Frontend endpoint examples (base: /api/v1):
// GET    /api/v1/cart
// POST   /api/v1/cart/items
// POST   /api/v1/cart/items/force
// PATCH  /api/v1/cart/items/:storeMenuId
// DELETE /api/v1/cart/items/:storeMenuId
// DELETE /api/v1/cart

async function getCart(req, res, next) {
  try {
    const result = await cartService.getCart(req.user.id);
    return success(res, result, '장바구니 조회 성공');
  } catch (err) {
    return next(err);
  }
}

async function addItem(req, res, next) {
  try {
    const { storeId, storeMenuId, quantity } = req.body;
    const result = await cartService.addItem({ userId: req.user.id, storeId, storeMenuId, quantity });
    return success(res, result, '장바구니에 담았습니다.', 'OK', 200);
  } catch (err) {
    return next(err);
  }
}

async function forceAddItem(req, res, next) {
  try {
    const { storeId, storeMenuId, quantity } = req.body;
    const result = await cartService.forceAddItem({ userId: req.user.id, storeId, storeMenuId, quantity });
    return success(res, result, '기존 장바구니를 비우고 새 매장으로 담았습니다.', 'OK', 200);
  } catch (err) {
    return next(err);
  }
}

async function updateItem(req, res, next) {
  try {
    const { storeMenuId } = req.params;
    const { quantity } = req.body;
    const result = await cartService.updateItemQuantity({ userId: req.user.id, storeMenuId, quantity });
    return success(res, result, '장바구니 수량을 변경했습니다.');
  } catch (err) {
    return next(err);
  }
}

async function removeItem(req, res, next) {
  try {
    const { storeMenuId } = req.params;
    const result = await cartService.removeItem({ userId: req.user.id, storeMenuId });
    return success(res, result, '장바구니에서 삭제했습니다.');
  } catch (err) {
    return next(err);
  }
}

async function clearCart(req, res, next) {
  try {
    const result = await cartService.clearCart(req.user.id);
    return success(res, result, result.cleared ? '장바구니를 비웠습니다.' : '이미 비어 있습니다.');
  } catch (err) {
    return next(err);
  }
}

router.get('/', auth, getCart);
router.post('/items', auth, addItem);
router.post('/items/force', auth, forceAddItem);
router.patch('/items/:storeMenuId', auth, updateItem);
router.delete('/items/:storeMenuId', auth, removeItem);
router.delete('/', auth, clearCart);

module.exports = router;


