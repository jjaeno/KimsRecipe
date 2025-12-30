// Responsibility: 기존(legacy) 라우터를 새 앱에 연결한다. 기존 파일을 그대로 require하여 경로만 맞춰준다.
// 하지 않는 일: 기존 코드 수정/응답 포맷 변경. 오직 mount 역할만 수행.

const express = require('express');
const authRoutes = require('../../../routes/auth');
const storeRoutes = require('../../../routes/stores');
const cartRoutes = require('../../../routes/cart');

const router = express.Router();

// legacy 엔드포인트 유지: /api/auth/*, /api/stores/getAll, /api/cart/*
router.use('/auth', authRoutes);
router.use('/stores', storeRoutes);
router.use('/cart', cartRoutes);

module.exports = router;
