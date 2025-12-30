// Responsibility: v1 영역의 표준화된 오류 객체를 정의한다. Service는 도메인 규칙 위반 시 AppError를 던지고, Controller는 next(err)로 위임하며, 글로벌 에러 핸들러가 HTTP 응답으로 변환한다.
// 하지 않는 일: HTTP 응답 작성, 로깅, 트랜잭션 제어.

class AppError extends Error {
  constructor(statusCode, code, message, data = {}) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.data = data;
  }
}

// 자주 쓰는 헬퍼 생성기. Service/Controller는 필요한 경우 직접 AppError를 만들어도 된다.
const errorFactory = {
  unauthorized(msg = '인증이 필요합니다.', data = {}) {
    return new AppError(401, 'UNAUTHORIZED', msg, data);
  },
  forbidden(msg = '권한이 없습니다.', data = {}) {
    return new AppError(403, 'FORBIDDEN', msg, data);
  },
  notFound(msg = '리소스를 찾을 수 없습니다.', data = {}) {
    return new AppError(404, 'NOT_FOUND', msg, data);
  },
  badRequest(msg = '잘못된 요청입니다.', data = {}) {
    return new AppError(400, 'BAD_REQUEST', msg, data);
  },
  conflict(msg = '리소스 충돌이 발생했습니다.', data = {}) {
    return new AppError(409, 'CONFLICT', msg, data);
  },
  internal(msg = '서버 오류가 발생했습니다.', data = {}) {
    return new AppError(500, 'INTERNAL_ERROR', msg, data);
  },
};

module.exports = { AppError, errorFactory };
