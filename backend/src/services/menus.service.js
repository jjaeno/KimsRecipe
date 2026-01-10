// Responsibility: 단일 메뉴 조회 도메인 로직. SQL 호출은 Repository에 위임하며, 존재 여부 판단 등의 규칙만 처리한다.
// 하지 않는 일: HTTP 응답, 트랜잭션 관리(단순 조회), 라우팅.

const pool = require('../db/pool');
const { errorFactory } = require('../utils/errors');

async function getMenuDetail(storeMenuId) {
  const menu = await findMenuById(storeMenuId);
  if (!menu) {
    throw errorFactory.notFound('해당 메뉴를 찾을 수 없습니다.');
  }
  return menu;
}


const withConn = (conn) => conn || pool;

async function findMenuById(storeMenuId, conn) {
  const executor = withConn(conn);
  const [rows] = await executor.query('SELECT * FROM storemenus WHERE storeMenuId = ? LIMIT 1', [storeMenuId]);
  return rows[0] || null;
}

module.exports = { getMenuDetail };


