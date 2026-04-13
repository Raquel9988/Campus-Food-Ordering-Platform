function validateLogin(email, password) {
  if (!email || !password) {
    return false;
  }
  return true;
}

module.exports = { validateLogin };