import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponse } from '../interfaces/api-response.interface';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const errorResponse = exception.getResponse() as any;

    const errorMessage =
      typeof errorResponse === 'string' ? errorResponse : errorResponse.message || 'An error occurred';

    const responseBody: ApiResponse<null> = {
      success: false,
      message: this.getErrorMessage(status),
      error: Array.isArray(errorMessage) ? errorMessage : [errorMessage],
      statusCode: status,
    };

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

    return 'Operation failed';
  }
}
