const express = require('express');
const { success } = require('../utils/response');
const authRoutes = require('./auth');
const storeRoutes = require('./stores');
const menuRoutes = require('./menus');
const cartRoutes = require('./cart');
const orderRoutes = require('./orders');
const homePartyRoutes = require('./homeParty');

const router = express.Router();

// Frontend endpoint examples (base: /api/v1):
// GET /api/v1/health
// GET /api/v1/ping

router.get('/health', (_req, res) => success(res, {}, 'pong'));
router.get('/ping', (_req, res) => success(res, {}, 'pong'));

router.use('/auth', authRoutes);
router.use('/stores', storeRoutes);
router.use('/menus', menuRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/home-party', homePartyRoutes);

module.exports = router;
