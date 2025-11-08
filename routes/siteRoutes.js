const express = require('express');
const router = express.Router();
const {
  getSites,
  getSite,
  createSite,
  updateSite,
  deleteSite
} = require('../controllers/siteController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getSites)
  .post(createSite);

router.route('/:id')
  .get(getSite)
  .put(updateSite)
  .delete(deleteSite);

module.exports = router;