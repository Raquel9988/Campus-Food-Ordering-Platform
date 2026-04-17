function validateRegister(email, role, businessName) {
  if (!email) return false;
  if (!email.includes("@")) return false;
  if (!role) return false;

  
  if (role === "vendor" && (!businessName || businessName.trim() === "")) {
    return false;
  }

  return true;
}

module.exports = { validateRegister };