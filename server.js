var express = require('express'),
  app = express(),
  port = process.env.PORT || 3001,
  bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


var routes = require('./api/routes/inventoryRoutes'); //importing route
routes(app); //register the route

// var events = require('./api/listeners/events'); // register event listener

app.listen(port);

console.log('Matcher RESTful API server started on: ' + port);