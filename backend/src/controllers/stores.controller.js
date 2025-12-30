// Responsibility: 매장/메뉴 조회 HTTP 입출력만 담당. 도메인 로직은 Service에 위임하고, 표준 응답 포맷으로 감싼다.
// 하지 않는 일: SQL, 데이터 가공, 트랜잭션 제어. 오류는 next로 위임.

const storeService = require('../services/stores.service');
const { success } = require('../utils/response');

async function getStores(_req, res, next) {
  try {
    const stores = await storeService.getAllStores();
    return success(res, { stores }, '스토어 목록 조회 성공');
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getStores,
};
