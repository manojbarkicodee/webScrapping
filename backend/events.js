const EventEmitter = require('events');
class ContactEventEmitter extends EventEmitter {}

const contactEventEmitter = new ContactEventEmitter();

module.exports = contactEventEmitter;
