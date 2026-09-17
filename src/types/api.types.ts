export const ResponseBuilder = {
  error(message: string, code: string, details?: unknown) {
    return {
      success: false as const,
      error: message,
      code,
      details,
    };
  },
};
