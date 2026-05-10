function isValidStatusTransition(currentStatus, nextStatus) {
  const allowedTransitions = {
    received: ["preparing"],
    preparing: ["ready"],
    ready: ["complete"],
    complete: [],
  };

  return allowedTransitions[currentStatus]?.includes(nextStatus) || false;
}

module.exports = {
  isValidStatusTransition,
};