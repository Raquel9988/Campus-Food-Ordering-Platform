function getRedirectPath(role, status) {
  if (role === "vendor") {
    if (status === "approved") return "../vendor/vendor-dashboard.html";
    if (status === "pending") return "PENDING";
    if (status === "suspended") return "SUSPENDED";
  }

  if (role === "student") return "../student/student-dashboard.html";
  if (role === "admin") return "../adminControls/admin-controls.html";

  return "UNKNOWN";
}

module.exports = { getRedirectPath };