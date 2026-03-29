export interface RetryOptions {
  maxRetries?: number;
  delay?: number;
  backoffMultiplier?: number;
}

export const handleNetworkErrorWithRetry = async <T>(
  requestFn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const { maxRetries = 3, delay = 1000, backoffMultiplier = 2 } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries) {
        break;
      }
      const shouldRetry = isRetryableError(error);
      if (!shouldRetry) {
        break;
      }
      if (attempt < maxRetries) {
        const waitTime = delay * Math.pow(backoffMultiplier, attempt);
        await sleep(waitTime);
      }
    }
  }

  throw lastError;
};

const isRetryableError = (error: any): boolean => {
  if (!error || !error.response) {
    return true;
  }

  const status = error.response?.status;
  return (
    (status >= 500 && status < 600) ||
    status === 429 ||
    status === 408 ||
    status === 502 || status === 503 || status === 504
  );
};

const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
export const withRetry = <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
) => {
  return () => handleNetworkErrorWithRetry(fn, options);
};