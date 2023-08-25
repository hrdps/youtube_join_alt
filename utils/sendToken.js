export const sendToken = (res, user, message, statusCode = 200) => {
  const token = user.getJWTToken();
  const options = {
    sameSite: 'none',
    secure: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    message,
    user,
  });
};
