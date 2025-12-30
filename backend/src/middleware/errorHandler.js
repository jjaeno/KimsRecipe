// Responsibility: 애플리케이션 전역 에러 처리. Controller/Service/Repository에서 던진 AppError를 HTTP 응답으로 변환하고, 알 수 없는 예외는 500으로 감싼다.
// 하지 않는 일: 비즈니스 복구/재시도, 트랜잭션 제어. 오직 로깅 + 응답 변환만 수행.

const { AppError } = require('../utils/errors');
const { fail } = require('../utils/response');

// Express 에러 핸들러 시그니처 (err, req, res, next)
function globalErrorHandler(err, _req, res, _next) {
  // 에러 흐름: 라우터/컨트롤러 -> next(err) -> 여기서 HTTP 응답 생성
  if (err instanceof AppError) {
    console.error('[AppError]', err.code, err.message, err.data);
    return fail(res, err.statusCode, err.code, err.message, err.data);
  }

  // JWT 검증 실패 등 외부 라이브러리 에러 대응
  if (err && err.name === 'JsonWebTokenError') {
    console.error('[JWT Error]', err.message);
    return fail(res, 401, 'UNAUTHORIZED', '유효하지 않은 토큰입니다.');
  }
  if (err && err.name === 'TokenExpiredError') {
    console.error('[JWT Expired]', err.message);
    return fail(res, 401, 'UNAUTHORIZED', '토큰이 만료되었습니다.');
  }

  console.error('[Unhandled Error]', err);
  return fail(res, 500, 'INTERNAL_ERROR', '서버 오류가 발생했습니다.');
}

module.exports = { globalErrorHandler };
