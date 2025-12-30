//v1 홈파티 예약 라우트 정의. 홈파티 예약 생성, 조회 기능 제공.

const express = require('express');
const controller = require('../../controllers/homeParty.controller');
const { auth } = require('../../middleware/auth');

const router = express.Router();

// 홈파티 예약 생성
router.post('/reservations', auth, controller.createReservation);

// 홈파티 예약 조회
router.get('/reservations', auth, controller.listReservations);

// 홈파티 예약 상세 조회
router.get('/reservations/:reservationId', auth, controller.getReservation);

module.exports = router;
