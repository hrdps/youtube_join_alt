export const sendToken = (res, user, message, statusCode = 200) => {
  const token = user.getJWTToken();
  const options = {
    sameSite: 'none',
    secure: true,
  };
  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    message,
    user,
  });
};
