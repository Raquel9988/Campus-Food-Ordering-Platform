function validateLogin(email) {
  if (!email) {
    return false;
  }
  return true;
}

function getRedirectPage(role) {
  if (role === "vendor") return "../vendor/vendor-dashboard.html";
  if (role === "student") return "../student/student-dashboard.html";
  if (role === "admin") return "../adminControls/admin-controls.html";
  return null;
}

function getVendorStatusMessage(status) {
  if (status === "pending") return "waiting";
  if (status === "approved") return "approved";
  if (status === "suspended") return "suspended";
  return "unknown";
}

module.exports = {
  validateLogin,
  getRedirectPage,
  getVendorStatusMessage
};