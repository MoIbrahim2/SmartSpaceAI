const sendSuccess = (res, messageKey, data = {}, statusCode = 200) => {
  const translatedMessage = res.req && typeof res.req.t === 'function' 
    ? res.req.t(messageKey) 
    : messageKey;

  return res.status(statusCode).json({
    success: true,
    message: translatedMessage,
    data
  });
};

module.exports = {
  sendSuccess
};
