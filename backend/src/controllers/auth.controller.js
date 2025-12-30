// HTTP 레이어에서 요청/응답을 처리. 입력 값을 Service에 전달하고, v1 표준 응답 포맷으로 결과를 반환.
// Controller가 하는 일: req 파싱, Service 호출, 응답 래핑, 에러 next 전달

const authService = require('../services/auth.service');
const { success } = require('../utils/response');

// 회원가입
async function signUp(req, res, next) {
  try {
    const result = await authService.signUp(req.body);
    return success(res, result, '회원가입에 성공했습니다.', 'OK', 201);
  } catch (err) {
    return next(err); // 에러 흐름: Controller -> next -> globalErrorHandler
  }
}
// 아이디 중복 확인
async function checkUsername(req, res, next) {
  try {
    // Body 또는 query 어느 쪽이든 허용하여 클라이언트 호환성 확보
    const username = req.body?.username ?? req.query?.username;
    const result = await authService.checkUsername(username);
    return success(res, result, result.available ? '사용 가능한 아이디입니다.' : '이미 사용 중입니다.');
  } catch (err) {
    return next(err);
  }
}
// 로그인
async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    return success(res, result, '로그인에 성공했습니다.');
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  signUp,
  checkUsername,
  login,
};
