import { HttpStatus, Logger } from '@nestjs/common'
import CustomException from '@lib/utils/custom.exception'
import { Result } from 'neverthrow'

/**
 * Base controller with common response handling methods
 */
export abstract class BaseController {
  protected readonly logger: Logger

  constructor(protected readonly controllerName: string) {
    this.logger = new Logger(controllerName)
  }

  /**
   * Handles Result type and converts to response format
   */
  protected handleResult<T, R>(
    result: Result<T, Error>,
    successCallback: (value: T) => R,
    errorCode = 'ERROR',
    httpStatus = HttpStatus.BAD_REQUEST,
  ): R {
    if (result.isErr()) {
      this.logger.error(
        `Error in ${this.controllerName}: ${result.error.message}`,
        result.error.stack,
      )
      throw new CustomException(errorCode, result.error.message, httpStatus)
    }

    return successCallback(result.value)
  }

  /**
   * Creates a standard success response
   */
  protected createSuccessResponse<T>(
    payload: T,
    statusCode = 'SUCCESS',
    message = 'Operation completed successfully',
  ): { statusCode: string; message: string; payload: T } {
    return {
      statusCode,
      message,
      payload,
    }
  }
}
