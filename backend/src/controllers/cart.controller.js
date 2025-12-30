// Responsibility: 장바구니 HTTP 입출력 처리. 인증된 사용자 ID를 Service로 전달하고, v1 응답 포맷으로 감싼다.
// Controller가 하는 일: req 파싱, Service 호출, 표준 응답 래핑, 에러는 next로 전달.
// Controller가 하지 않는 일: 트랜잭션 관리, DB 접근, 비즈니스 규칙 판단.

const cartService = require('../services/cart.service');
const { success } = require('../utils/response');

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

module.exports = {
  getCart,
  addItem,
  forceAddItem,
  updateItem,
  removeItem,
  clearCart,
};
