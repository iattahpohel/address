import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  RpcExceptionFilter,
} from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { Observable, of } from 'rxjs'

/**
 * Exception filter for HTTP requests
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    const status = exception.getStatus()
    const exceptionResponse = exception.getResponse()

    const errorResponse = {
      statusCode: status,
      errorCode:
        typeof exceptionResponse === 'object' && exceptionResponse !== null
          ? (exceptionResponse as { errorCode?: string }).errorCode || 'UNKNOWN_ERROR'
          : 'UNKNOWN_ERROR',
      message:
        typeof exceptionResponse === 'object' && exceptionResponse !== null
          ? (exceptionResponse as { message?: string | string[] }).message?.toString() ||
            exception.message
          : exception.message,
      timestamp: new Date().toISOString(),
    }

    this.logger.error(
      `HTTP Exception: ${status} - ${errorResponse.message}`,
      exception.stack,
    )

    response.status(status).json(errorResponse)
  }
}

/**
 * Exception filter for gRPC requests
 * Catches all exceptions and converts them to gRPC-compatible format
 */
@Catch()
export class CustomRpcExceptionFilter
  implements RpcExceptionFilter<RpcException>
{
  private readonly logger = new Logger(CustomRpcExceptionFilter.name)

  catch(exception: RpcException | Error): Observable<unknown> {
    let errorResponse: {
      statusCode: number
      errorCode: string
      message: string
      timestamp: string
    }

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse()
      errorResponse = {
        statusCode: exception.getStatus(),
        errorCode:
          typeof exceptionResponse === 'object' && exceptionResponse !== null
            ? (exceptionResponse as { errorCode?: string }).errorCode || 'UNKNOWN_ERROR'
            : 'UNKNOWN_ERROR',
        message:
          typeof exceptionResponse === 'object' && exceptionResponse !== null
            ? (exceptionResponse as { message?: string | string[] }).message?.toString() ||
              exception.message
            : exception.message,
        timestamp: new Date().toISOString(),
      }
    } else if (exception instanceof RpcException) {
      const error = exception.getError()
      errorResponse = {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        errorCode: 'RPC_ERROR',
        message:
          typeof error === 'string' ? error : JSON.stringify(error) || 'Unknown RPC error',
        timestamp: new Date().toISOString(),
      }
    } else {
      errorResponse = {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        errorCode: 'INTERNAL_ERROR',
        message: exception?.message || 'Internal server error',
        timestamp: new Date().toISOString(),
      }
    }

    this.logger.error(
      `gRPC Exception: ${errorResponse.errorCode} - ${errorResponse.message}`,
      exception instanceof Error ? exception.stack : undefined,
    )

    return of(errorResponse)
  }
}
