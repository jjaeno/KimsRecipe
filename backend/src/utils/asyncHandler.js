// Responsibility: 비동기 Express 핸들러에서 발생한 예외를 next로 위임하여 글로벌 에러 핸들러까지 전달한다. 컨트롤러/라우트에서 반복되는 try/catch를 제거하고, 에러 흐름을 명확히 한다.
// 하지 않는 일: 에러를 삼키거나 응답을 직접 작성하지 않는다. 단순히 next(err)로 전달한다.

// 사용 예시: router.get('/path', asyncHandler(controllerFn));
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { asyncHandler };
