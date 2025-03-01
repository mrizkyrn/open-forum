import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponse } from '../interfaces/api-response.interface';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const errorResponse = exception.getResponse() as any;

    const errorMessage =
      typeof errorResponse === 'string' ? errorResponse : errorResponse.message || 'An error occurred';

    const responseBody: ApiResponse<null> = {
      success: false,
      message: this.getErrorMessage(request.method, request.url, status),
      error: Array.isArray(errorMessage) ? errorMessage : [errorMessage],
      statusCode: status,
    };

    response.status(status).json(responseBody);
  }

  private getErrorMessage(method: string, url: string, status: number): string {
    if (status === HttpStatus.UNAUTHORIZED) return 'Authentication failed';
    if (status === HttpStatus.FORBIDDEN) return 'You do not have permission';
    if (status === HttpStatus.NOT_FOUND) return 'Resource not found';
    if (status === HttpStatus.CONFLICT) return 'Resource conflict';

    return 'Operation failed';
  }
}
