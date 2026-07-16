const inFlightRequests = new Map();

export const dedupeRequest = (key, requestFn) => {
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key);
  }

  const request = Promise.resolve()
    .then(requestFn)
    .finally(() => {
      inFlightRequests.delete(key);
    });

  inFlightRequests.set(key, request);
  return request;
};
