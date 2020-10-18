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
  app.use(router.error);

  //for /index page
  //app.get('/', function(request,response){
   // response.sendFile('index.html',{root:path.join(__dirname,'./views')});
  //});

  //for /home page
 // app.get('/home', function(request,response){
  //  response.sendFile('home.html',{root:path.join(__dirname,'./views')});
  //});

  //for /about page
  //app.get('/about', function(request,response){
    //response.sendFile('about.html',{root:path.join(__dirname,'./views')});
  //});

  //for /contact page
  //app.get('/contact', function(request,response){
   // response.sendFile('contact.html',{root:path.join(__dirname,'./views')});
  //});

 // app.listen(3000,function(){
   // console.log('Listening at port 3000...');
  //});

  //app.use('/assets',express.static(__dirname + '/assets'));

};