const express = require('express');
const router = express.Router();
const {
  getCrews,
  getCrew,
  createCrew,
  updateCrew,
  deleteCrew
} = require('../controllers/crewController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getCrews).post(createCrew);
router.route('/:id').get(getCrew).put(updateCrew).delete(deleteCrew);

module.exports = router;