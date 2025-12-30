// Responsibility: 라우팅 집결 지점. legacy 라우트(/api/*)와 신규 v1 라우트(/api/v1/*)를 모두 마운트한다.
// 여기서 하는 일: URL prefix 결정 및 하위 라우터 연결. 하지 않는 일: 비즈니스 로직/DB 접근/응답 포맷 결정.

const express = require('express');
const legacyRouter = require('./legacy');
const v1Router = require('./v1');

const router = express.Router();

// 기존 프론트가 사용하는 legacy 엔드포인트 유지 (/api/*)
router.use('/api', legacyRouter);

// 신규 v1 엔드포인트
router.use('/api/v1', v1Router);

module.exports = router;
