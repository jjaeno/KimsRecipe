//v1 버전 라우터 엔트리. 버전별 네임스페이스(/api/v1)를 관리, 각 도메인 라우트를 연결

const express = require('express');
const { asyncHandler } = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const authRoutes = require('./auth.routes');
const storeRoutes = require('./stores.routes');
const menuRoutes = require('./menus.routes');
const cartRoutes = require('./cart.routes');
const orderRoutes = require('./orders.routes');
const homePartyRoutes = require('./homeParty.routes');

const router = express.Router();

// Health 체크: 배포/모니터링용 최소 동작 확인
router.get('/health', (_req, res) => success(res, {}, 'pong'));
router.get('/ping', (_req, res) => success(res, {}, 'pong'));

// 인증 라우트 연결
router.use('/auth', authRoutes);
// 매장/메뉴 조회 라우트 연결
router.use('/stores', storeRoutes);
// 메뉴 관련 라우트 연결
router.use('/menus', menuRoutes);
// 장바구니 관련 라우트 연결
router.use('/cart', cartRoutes);
// 주문 관련 라우트 연결
router.use('/orders', orderRoutes);
// 홈파티 예약 관련 라우트 연결
router.use('/home-party', homePartyRoutes);

module.exports = router;
