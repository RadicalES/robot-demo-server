const express = require('express');
const router = express.Router();
const robotController = require('../../controllers/robotController');

router.route('/robot/api/setup').post(robotController.robotCntrlBootUrl);

module.exports = router;