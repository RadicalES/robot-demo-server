/** An error that already knows what HTTP status it deserves. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }

  static badRequest(message: string): ApiError {
    return new ApiError(400, message)
  }

  static notFound(message: string): ApiError {
    return new ApiError(404, message)
  }
}
