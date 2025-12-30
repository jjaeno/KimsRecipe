// Responsibility: v1 응답 포맷을 한 곳에서 관리한다. Controller가 HTTP status/body를 직접 만들지 않고, 이 헬퍼를 통해 성공/실패 응답을 생성한다.
// 하지 않는 일: 비즈니스 로직/검증/DB 접근. 단순히 JSON 형태를 통일한다.

// Controller에서 사용: return success(res, { ... }, '메시지'); / return fail(res, 400, 'INVALID', '메시지');
function success(res, data = {}, message = 'OK', code = 'OK', status = 200) {
  return res.status(status).json({
    success: true,
    code,
    message,
    data,
  });
}

// 실패 응답. status는 HTTP 코드, code는 도메인/비즈니스 에러 코드.
function fail(res, status, code, message, data = {}) {
  return res.status(status).json({
    success: false,
    code,
    message,
    data,
  });
}

module.exports = { success, fail };
