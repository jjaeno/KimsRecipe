const express = require('express');
const homePartyService = require('../services/homeParty.service');
const { success } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { auth } = require('../middleware/auth');

const router = express.Router();

// POST /api/v1/home-party/reservations : 예약 생성
// GET  /api/v1/home-party/sets/recommend : 추천 세트 조회
// GET  /api/v1/home-party/reservations : 예약 목록 조회
// GET  /api/v1/home-party/reservations/:reservationId : 예약 상세 조회

async function createReservation(req, res, next) {
  try {
    const data = await homePartyService.createReservation(req.user.id, req.body);
    return success(res, data, '예약을 생성했습니다.', 'OK', 201);
  } catch (err) {
    return next(err);
  }
}

async function listReservations(req, res, next) {
  try {
    const reservations = await homePartyService.listReservations(req.user.id);
    return success(res, { reservations }, '예약 목록 조회 성공');
  } catch (err) {
    return next(err);
  }
}

async function getReservation(req, res, next) {
  try {
    const { reservationId } = req.params;
    const reservation = await homePartyService.getReservation(req.user.id, reservationId);
    return success(res, { reservation }, '예약 상세 조회 성공');
  } catch (err) {
    return next(err);
  }
}

async function getRecommendedSet(req, res, next) {
  try {
    const { storeId, eventType, headcount } = req.query;
    const sets = await homePartyService.getRecommendedSet(Number(storeId), eventType, Number(headcount));
    if (!sets.length) {
      throw new AppError(404, 'NOT_FOUND', '추천 가능한 세트가 없습니다.');
    }
    return success(res, { sets }, '추천 세트 조회 성공');
  } catch (err) {
    return next(err);
  }
}

router.get('/sets/recommend', getRecommendedSet);
router.post('/reservations', auth, createReservation);
router.get('/reservations', auth, listReservations);
router.get('/reservations/:reservationId', auth, getReservation);

module.exports = router;

