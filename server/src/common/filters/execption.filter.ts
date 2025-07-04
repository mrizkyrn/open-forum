import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { EntityNotFoundError, QueryFailedError, TypeORMError } from 'typeorm';
import { ApiResponse } from '../interfaces/api-response.interface';

@Catch()
export class ExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ExceptionsFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Log the error with details for debugging
    if (exception.message !== 'Unauthorized') {
      this.logger.error(
        `Exception occurred during ${request.method} ${request.url}: ${exception.message}`,
        exception.stack,
      );
    }

    let status: number;
    let errorMessage: string | string[];

    // Handle different types of exceptions
    if (exception instanceof HttpException) {
      // NestJS HTTP exceptions
      status = exception.getStatus();
      const errorResponse = exception.getResponse() as any;
      errorMessage = errorResponse.message || exception.message;
    } else if (
      exception instanceof QueryFailedError ||
      exception instanceof EntityNotFoundError ||
      exception instanceof TypeORMError
    ) {
      // All TypeORM errors - use a generic message for the client
      errorMessage = 'Database error occurred';

      // Set appropriate status based on error type
      if (exception instanceof EntityNotFoundError) {
        status = HttpStatus.NOT_FOUND;
      } else {
        status = HttpStatus.BAD_REQUEST;
      }

      // Log detailed error information for debugging
      if (exception instanceof QueryFailedError) {
        const error = exception as any;
        this.logger.error(
          `Database query error: Code=${error.code || 'unknown'}, Detail=${error.detail || 'n/a'}, Query=${error.query || 'n/a'}`,
        );
      } else {
        this.logger.error(`TypeORM error: ${exception.name}: ${exception.message}`);
      }
    } else {
      // All other unhandled exceptions
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorMessage = 'An unexpected error occurred';
    }

    // Format error messages consistently
    const formattedErrorMessage = Array.isArray(errorMessage) ? errorMessage : [errorMessage];

    // Create the response body
    const responseBody: ApiResponse<null> = {
      success: false,
      message: this.getErrorMessage(status),
      error: formattedErrorMessage,
      statusCode: status,
    };

    // Send response
    response.status(status).json(responseBody);
  }

  private getErrorMessage(status: number): string {
    if (status === HttpStatus.UNAUTHORIZED) return 'Authentication failed';
    if (status === HttpStatus.FORBIDDEN) return 'You do not have permission';
    if (status === HttpStatus.NOT_FOUND) return 'Resource not found';
    if (status === HttpStatus.CONFLICT) return 'Resource conflict';
    if (status === HttpStatus.BAD_REQUEST) return 'Invalid request';
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) return 'Internal server error';
    if (status === HttpStatus.NOT_IMPLEMENTED) return 'Not implemented';
    if (status === HttpStatus.SERVICE_UNAVAILABLE) return 'Service unavailable';
    if (status === HttpStatus.UNPROCESSABLE_ENTITY) return 'Validation failed';
    if (status === HttpStatus.TOO_MANY_REQUESTS) return 'Too many requests';
    if (status === HttpStatus.GATEWAY_TIMEOUT) return 'Gateway timeout';

    return 'Operation failed';
  }
}
