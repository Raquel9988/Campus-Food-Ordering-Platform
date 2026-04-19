function canUpdateStatus(current, next) {
  if (current === "received" && next === "preparing") return true;
  if (current === "preparing" && next === "ready") return true;
  return false;
}

module.exports = { canUpdateStatus };