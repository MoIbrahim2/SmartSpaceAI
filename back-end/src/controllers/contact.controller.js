const contactService = require('../services/contact.service');
const { sendSuccess } = require('../utils/responseHelper');
const HTTP_STATUS = require('../constants/statusCodes');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Handle submission of Contact Us message
 */
const createMessage = asyncHandler(async (req, res) => {
  const contact = await contactService.createMessage(req.body);
  return sendSuccess(res, 'contact.submit_success', { contact }, HTTP_STATUS.CREATED);
});

module.exports = {
  createMessage
};
