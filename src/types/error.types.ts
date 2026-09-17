export class AppError extends Error {
  public readonly statusCode: number;

  constructor(statusCode: number, message: string, override cause?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.cause = cause;
  }
}
