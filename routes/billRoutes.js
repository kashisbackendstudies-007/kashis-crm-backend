const express = require('express');
const router = express.Router();
const {
  getBills,
  getBill,
  createBill,
  updateBill,
  deleteBill,
  getNextBillNumber
} = require('../controllers/billController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/next-number', getNextBillNumber);
router.route('/').get(getBills).post(createBill);
router.route('/:id').get(getBill).put(updateBill).delete(deleteBill);

module.exports = router;