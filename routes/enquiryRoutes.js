const express = require('express');
const router = express.Router();
const {
  getEnquiries,
  getEnquiry,
  createEnquiry,
  updateEnquiry,
  deleteEnquiry
} = require('../controllers/enquiryController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getEnquiries).post(createEnquiry);
router.route('/:id').get(getEnquiry).put(updateEnquiry).delete(deleteEnquiry);

module.exports = router;