import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/api-response.interface';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const response = context.switchToHttp().getResponse();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((data) => ({
        success: true,
        message: this.getSuccessMessage(context),
        data,
        statusCode,
      })),
    );
  }

  private getSuccessMessage(context: ExecutionContext): string {
    const apiPrefix = process.env.API_PREFIX || 'api';
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const path = request.route.path;

    if (method === 'POST' && path === `/${apiPrefix}/auth/login`) return 'Login successful';
    if (method === 'POST' && path === `/${apiPrefix}/auth/register`) return 'Registration successful';
    if (method === 'POST' && path === `/${apiPrefix}/auth/logout`) return 'Logout successful';
    if (method === 'POST' && path === `/${apiPrefix}/auth/refresh`) return 'Token refreshed successfully';
    if (method === 'GET' && path ===`/${apiPrefix}/auth/profile`) return 'Profile retrieved successfully';

    if (method === 'POST' && path === `/${apiPrefix}/users`) return 'User created successfully';
    if (method === 'GET' && path === `/${apiPrefix}/users`) return 'Users retrieved successfully';
    if (method === 'GET' && path === `/${apiPrefix}/users/me`) return 'Profile retrieved successfully';
    if (method === 'GET' && path === `/${apiPrefix}/users/:id`) return 'User retrieved successfully';
    if (method === 'PUT' && path === `/${apiPrefix}/users/:id`) return 'User updated successfully';
    if (method === 'DELETE' && path === `/${apiPrefix}/users/:id`) return 'User deleted successfully';

    return 'Operation successful';
  }
}
