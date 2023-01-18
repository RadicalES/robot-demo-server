/* (C) 2020 Radical Electronic Systems CC */
const express = require('express');
const router = require('./router');
const api = require('../api/packet.json');
 
module.exports = (app, config) => {
  app.get('/api', (req, res) => res.status(200).send(
    "<html><body><h2>Welcome to the Robot API</h2><p>" + JSON.stringify(api) +
    "</p></body></html>"
  ));


  app.post('/setup.cgi', router.base, router.setup);
  app.post('/scale.cgi', router.base, router.scale);
  app.post('/term.cgi', router.base, router.term);
  app.post('/scan.cgi', router.base, router.scan);
  app.post('/label.cgi', router.base, router.label);
  app.post('/forklift.cgi', router.base, router.forklift);
  app.post('/forklift-sss.cgi', router.base, router.forkliftServerState);
  
  app.get('/term.cgi/:command?', router.baseGet, router.termGet);
  app.get('/scan.cgi/:command?', router.baseGet, router.scanGet);
  app.get('/setup.cgi/:command?', router.baseGet, router.setupGet);
  app.get('/scale.cgi/:command?', router.baseGet, router.scaleGet);
  app.get('/scaleJMT.cgi', router.scaleJMTGet);

  app.use(router.error);

};