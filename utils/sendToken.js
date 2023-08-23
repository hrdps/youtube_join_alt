export const sendToken = (res, user, message, statusCode = 200) => {
  const token = user.getJWTToken();
  const options = {
    // expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    httpOnly: false,
    // sameSite: 'none',
    // secure: true,
    maxAge: 15 * 24 * 60 * 60 * 1000, // AUTH_SECRET_TOKEN_LIFE is in seconds, convert seconds to ms
    httpOnly: true,
    path: '/',
    secure: false,
    domain: 'localhost',
  };
  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    message,
    user,
  });
};
