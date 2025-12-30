// Responsibility: JWT 인증 처리. 요청 헤더에서 토큰을 읽어 검증하고, 성공 시 req.user에 인증 정보를 주입한다.
// 하지 않는 일: 도메인 권한 판단, 응답 작성. 실패 시 AppError/예외를 next로 넘기고 글로벌 에러 핸들러가 응답을 만든다.

const jwt = require('jsonwebtoken');
const { AppError } = require('../utils/errors');

const JWT_SECRET = process.env.JWT_SECRET;

function auth(req, _res, next) {
  // Controller/Service는 req.user가 있다고 가정하고 도메인 로직을 수행한다.
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'UNAUTHORIZED', '액세스 토큰이 필요합니다.');
    }
    if (!JWT_SECRET) {
      throw new AppError(500, 'INTERNAL_ERROR', '서버 환경설정(JWT_SECRET)이 누락되었습니다.');
    }
    const token = authHeader.slice(7).trim();
    const decoded = jwt.verify(token, JWT_SECRET);
    const id = decoded.id ?? decoded.userId ?? decoded.sub;
    if (!id) {
      throw new AppError(401, 'UNAUTHORIZED', '토큰에 사용자 식별자가 없습니다.');
    }
    req.user = { ...decoded, id: Number(id) };
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = { auth };
