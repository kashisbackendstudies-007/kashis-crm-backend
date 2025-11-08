const express = require('express');
const router = express.Router();
const {
 // getDashboard,
  getRevenueChart,
  getSiteStatusDistribution,
  getExpenseBreakdown,
  getTopClients
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.use(protect);

//router.get('/', getDashboard);
router.get('/revenue-chart', getRevenueChart);
router.get('/site-status-distribution', getSiteStatusDistribution);
router.get('/expense-breakdown', getExpenseBreakdown);
router.get('/top-clients', getTopClients);

module.exports = router;