function validateRegister(email, password) {
  if (!email || !password) return false;
  if (!email.includes("@")) return false;
  if (password.length < 3) return false;
  return true;
}

module.exports = { validateRegister };