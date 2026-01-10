const express = require('express');
const menuService = require('../services/menus.service');
const { success } = require('../utils/response');

const router = express.Router();

// Frontend endpoint examples (base: /api/v1):
// GET /api/v1/menus/:storeMenuId

async function getMenuDetail(req, res, next) {
  try {
    const { storeMenuId } = req.params;
    const menu = await menuService.getMenuDetail(storeMenuId);
    return success(res, { menu }, '메뉴 조회 성공');
  } catch (err) {
    return next(err);
  }
}

router.get('/:storeMenuId', getMenuDetail);

module.exports = router;


