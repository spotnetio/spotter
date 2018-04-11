'use strict';

module.exports = function(app) {
	
  var inventory = require('../controllers/inventoryController');

  // inventory Routes
  app.route('/inventory/:userId')
    .get(inventory.list_inventory);
  app.route('/inventory/:userId')
    .post(inventory.add_inventory);
};