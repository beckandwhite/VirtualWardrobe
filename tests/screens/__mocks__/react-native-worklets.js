// Minimal worklets stub — only the parts Reanimated's mock needs at import time.
module.exports = {
  WorkletsModule: { addListener: () => {}, removeListeners: () => {} },
  createWorklet: (fn) => fn,
  createSharedValue: (v) => ({ value: v }),
};
