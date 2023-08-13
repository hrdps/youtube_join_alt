const catchAsncError = (passedFuction) => (req, res, next) => {
  Promise.resolve(passedFuction(req, res, next)).catch(next);
};
export default catchAsncError;
