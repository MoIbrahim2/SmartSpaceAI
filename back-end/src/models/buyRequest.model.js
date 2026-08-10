/**
 * Deprecated: BuyRequest model has been replaced by the unified Order model (`orders` collection).
 * Re-exporting Order model to ensure complete backward compatibility.
 */
const Order = require('./order.model');

module.exports = Order;

