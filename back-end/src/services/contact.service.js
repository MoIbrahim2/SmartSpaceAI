const Contact = require('../models/contact.model');

/**
 * Save a new contact us message to the database
 * @param {Object} contactData - The message data (name, email, subject, message)
 * @returns {Promise<Object>} The saved contact document
 */
const createMessage = async (contactData) => {
  const { name, email, message } = contactData;
  const newContact = await Contact.create({
    name,
    email,
    message
  });
  return newContact;
};

module.exports = {
  createMessage
};
