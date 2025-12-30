// Responsibility: 주문 HTTP 입출력 처리. 요청 값을 Service로 넘기고 표준 응답 포맷으로 감싼다.
// Controller 역할: 파라미터 추출, Service 호출, 응답 래핑, 에러 next 위임.
// 하지 않는 일: 트랜잭션 제어, SQL 실행, 비즈니스 규칙 판단.

const ordersService = require('../services/orders.service');
const { success } = require('../utils/response');

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

module.exports = {
  createOrder,
  listOrders,
  getOrderDetail,
};
