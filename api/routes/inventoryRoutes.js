'use strict';

module.exports = function(app) {
	
  var inventory = require('../controllers/inventoryController');

  // inventory Routes
  app.route('/inventory')
    .get(inventory.list_inventory);
};