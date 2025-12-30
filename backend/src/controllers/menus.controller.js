// Responsibility: 단일 메뉴 조회 HTTP 레이어. URL 파라미터를 Service로 전달하고, 응답 포맷만 책임진다.
// 하지 않는 일: SQL 실행, 비즈니스 규칙 판단, 트랜잭션 제어.

const menuService = require('../services/menus.service');
const { success } = require('../utils/response');

async function getMenuDetail(req, res, next) {
  try {
    const { storeMenuId } = req.params;
    const menu = await menuService.getMenuDetail(storeMenuId);
    return success(res, { menu }, '메뉴 조회 성공');
  } catch (err) {
    return next(err);
  }
}

module.exports = { getMenuDetail };
