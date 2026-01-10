const express = require('express');
const storeService = require('../services/stores.service');
const { success } = require('../utils/response');

const router = express.Router();

// Frontend endpoint examples (base: /api/v1):
// GET /api/v1/stores

async function getStores(_req, res, next) {
  try {
    const stores = await storeService.getAllStores();
    return success(res, { stores }, '스토어 목록 조회 성공');
  } catch (err) {
    return next(err);
  }
}

router.get('/', getStores);

module.exports = router;


