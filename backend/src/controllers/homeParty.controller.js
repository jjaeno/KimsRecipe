// Responsibility: 홈파티 예약 HTTP 입출력. 인증된 사용자 정보를 Service에 전달하고, 표준 응답 포맷을 반환한다.
// 하지 않는 일: SQL/트랜잭션, 비즈니스 규칙 판단. 에러는 next로 위임.

const homePartyService = require('../services/homeParty.service');
const { success } = require('../utils/response');

async function createReservation(req, res, next) {
  try {
    const data = await homePartyService.createReservation(req.user.id, req.body);
    return success(res, data, '예약을 생성했습니다.', 'OK', 201);
  } catch (err) {
    return next(err);
  }
}

async function listReservations(req, res, next) {
  try {
    const reservations = await homePartyService.listReservations(req.user.id);
    return success(res, { reservations }, '예약 목록 조회 성공');
  } catch (err) {
    return next(err);
  }
}

async function getReservation(req, res, next) {
  try {
    const { reservationId } = req.params;
    const reservation = await homePartyService.getReservation(req.user.id, reservationId);
    return success(res, { reservation }, '예약 상세 조회 성공');
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createReservation,
  listReservations,
  getReservation,
};
