const express = require('express');
const router = express.Router();
const {
  getInstruments,
  getInstrument,
  createInstrument,
  updateInstrument,
  deleteInstrument
} = require('../controllers/instrumentController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getInstruments).post(createInstrument);
router.route('/:id').get(getInstrument).put(updateInstrument).delete(deleteInstrument);

module.exports = router;