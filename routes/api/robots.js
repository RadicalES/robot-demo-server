const express = require('express');
const router = express.Router();
const robotController = require('../../controllers/robotController');

router.use('/*', robotController.robotCntrlPreProcess);
router.route('/setup').post(robotController.robotCntrlSetupPost);
router.get('/setup/:command?', robotController.robotCntrlSetupGet)
router.post('/term', robotController.robotCntrlTerminalPost)
router.get('/term/:command?', robotController.robotCntrlTerminalGet)
router.post('/scan', robotController.robotCntrlScanPost)
router.get('/scan/:command?', robotController.robotCntrlScaleGet)
router.post('/label', robotController.robotCntrlLabelPost)
router.get('/label/:command?', robotController.robotCntrlLabelGet)
router.post('/forklift', robotController.robotCntrlForkliftPost)
router.post('/forklift-sss', robotController.robotCntrlForkliftSvrStatePost);
router.use('/*', robotController.robotCntrlError);

module.exports = router;

