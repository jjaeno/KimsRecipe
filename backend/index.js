// Responsibility: 서버 부트스트랩 엔트리. 환경 변수를 로드하고 src/app.js에서 조립된 Express 애플리케이션을 실행한다. 여기서는 listen만 담당하며 비즈니스 로직이나 라우팅은 app.js에 위임한다.
// 하지 않는 일: 라우팅/미들웨어/에러 처리 구현. 순수하게 서버 기동만 수행.

require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`서버 실행 중 http://localhost:${PORT}`);
});
