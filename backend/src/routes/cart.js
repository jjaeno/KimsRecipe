const express = require('express');
const cartService = require('../services/cart.service');
const { success } = require('../utils/response');
const { auth } = require('../middleware/auth');

const router = express.Router();

// GET    /api/v1/cart
// PATCH  /api/v1/cart/items/:storeMenuId
// DELETE /api/v1/cart/items/:storeMenuId
// DELETE /api/v1/cart/items (bulk)
// DELETE /api/v1/cart
// GET    /api/v1/cart/validate

// 장바구니 조회
async function getCart(req, res, next) {
  try {
    const result = await cartService.getCart(req.user.id);
    return success(res, result, '장바구니 조회 성공');
  } catch (err) {
    return next(err);
  }
}

// 장바구니 항목 추가
async function addItem(req, res, next) {
  try {
    const { storeId, storeMenuId, quantity } = req.body;
    const result = await cartService.addItem({ userId: req.user.id, storeId, storeMenuId, quantity });
    return success(res, result, '장바구니에 담았습니다.', 'OK', 200);
  } catch (err) {
    return next(err);
  }
}

// 장바구니 항목 수량 변경
async function updateItem(req, res, next) {
  try {
    const { storeMenuId } = req.params;
    const { quantity } = req.body;
    // 상세 검증/무결성은 서비스에서 수행한다.
    const result = await cartService.updateItemQuantity({ userId: req.user.id, storeMenuId, quantity });
    return success(res, result, '장바구니 수량을 변경했습니다.');
  } catch (err) {
    return next(err);
  }
}

// 장바구니 항목 삭제
async function removeItem(req, res, next) {
  try {
    const { storeMenuId } = req.params;
    const result = await cartService.removeItem({ userId: req.user.id, storeMenuId });
    return success(res, result, '장바구니에서 삭제했습니다.');
  } catch (err) {
    return next(err);
  }
}

// 장바구니 항목 다건 삭제
async function removeItemsBulk(req, res, next) {
  try {
    const { storeMenuIds } = req.body;
    // 다건 삭제는 반드시 트랜잭션으로 처리한다.
    const result = await cartService.removeItemsBulk({ userId: req.user.id, storeMenuIds });
    return success(res, result, '선택한 항목을 삭제했습니다.');
  } catch (err) {
    return next(err);
  }
}

// 장바구니 비우기
async function clearCart(req, res, next) {
  try {
    const result = await cartService.clearCart(req.user.id);
    return success(res, result, result.cleared ? '장바구니를 비웠습니다.' : '이미 비어 있습니다.');
  } catch (err) {
    return next(err);
  }
}

// 장바구니 검증
async function validateCart(req, res, next) {
  try {
    // priceMap은 GET 쿼리로 전달된다. 예: ?priceMap={"12":4500}
    const raw = req.query.priceMap;
    const priceMap = raw ? JSON.parse(raw) : null;

    // selectedIds는 GET 쿼리로 전달된다. 예: ?selectedIds=[12,34]
    const rawSelectedIds = req.query.selectedIds;
    const selectedIds = rawSelectedIds ? JSON.parse(rawSelectedIds) : null;
    
    const result = await cartService.validateCart({ userId: req.user.id, priceMap, selectedIds });
    return success(res, result, '장바구니 검증 성공');
  } catch (err) {
    return next(err);
  }
}

router.get('/', auth, getCart);
router.post('/items', auth, addItem);
router.get('/validate', auth, validateCart);
router.patch('/items/:storeMenuId', auth, updateItem);
router.delete('/items/:storeMenuId', auth, removeItem);
router.delete('/items', auth, removeItemsBulk);
router.delete('/', auth, clearCart);

module.exports = router;
