'use strict';

module.exports = function(app) {
	
  var inventory = require('../controllers/inventoryController');

  // inventory Routes
  app.route('/tokens/')
    .get(inventory.tokens);
  app.route('/tokens/:token')
    .get(inventory.tokens);
  app.route('/contracts/')
    .get(inventory.contracts);
  app.route('/contracts/:id')
    .get(inventory.contracts);
  app.route('/inventory/')
    .get(inventory.list_inventory);
  app.route('/inventory/:userId')
    .get(inventory.list_inventory);
  app.route('/inventory/:userId')
    .post(inventory.add_inventory);
  app.route('/recall/:userId')
    .post(inventory.recall);
  app.route('/b2c/:userId')
    .post(inventory.b2c);
};