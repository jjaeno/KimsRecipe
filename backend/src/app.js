// Responsibility: Express 애플리케이션 조립. 미들웨어/라우터/에러 핸들러를 연결하고, 실제 서버 기동은 상위(index.js)에서 담당한다.
// 하지 않는 일: 비즈니스 로직/DB 접근/응답 포맷 결정. 여기서는 파이프라인 조립만 담당한다.

const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { globalErrorHandler } = require('./middleware/errorHandler');

const app = express();

// 공통 미들웨어: 요청 파싱 및 CORS 설정. 비즈니스 검증은 Controller/Service에서 수행.
app.use(cors());
app.use(express.json());

// v1 라우트 마운트
app.use('/api/v1', routes);

// 글로벌 에러 핸들러: next(err)로 전달된 모든 오류를 여기서 응답으로 변환한다.
app.use(globalErrorHandler);

module.exports = app;
