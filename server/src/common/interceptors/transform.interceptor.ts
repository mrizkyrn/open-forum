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

    // Auth messages
    if (method === 'POST' && path === `/${apiPrefix}/auth/login`) return 'Login successful';
    if (method === 'POST' && path === `/${apiPrefix}/auth/register`) return 'Registration successful';
    if (method === 'POST' && path === `/${apiPrefix}/auth/logout`) return 'Logout successful';
    if (method === 'POST' && path === `/${apiPrefix}/auth/refresh`) return 'Token refreshed successfully';
    if (method === 'GET' && path === `/${apiPrefix}/auth/profile`) return 'Profile retrieved successfully';

    // User messages
    if (method === 'POST' && path === `/${apiPrefix}/users`) return 'User created successfully';
    if (method === 'GET' && path === `/${apiPrefix}/users`) return 'Users retrieved successfully';
    if (method === 'GET' && path === `/${apiPrefix}/users/me`) return 'Profile retrieved successfully';
    if (method === 'GET' && path === `/${apiPrefix}/users/:id`) return 'User retrieved successfully';
    if (method === 'PUT' && path === `/${apiPrefix}/users/:id`) return 'User updated successfully';
    if (method === 'DELETE' && path === `/${apiPrefix}/users/:id`) return 'User deleted successfully';

    // Discussion messages
    if (method === 'POST' && path === `/${apiPrefix}/discussions`) return 'Discussion created successfully';
    if (method === 'GET' && path === `/${apiPrefix}/discussions`) return 'Discussions retrieved successfully';
    if (method === 'GET' && path === `/${apiPrefix}/discussions/:id`) return 'Discussion retrieved successfully';
    if (method === 'GET' && path === `/${apiPrefix}/discussions/tags/popular`)
      return 'Popular tags retrieved successfully';
    if (method === 'PUT' && path === `/${apiPrefix}/discussions/:id`) return 'Discussion updated successfully';
    if (method === 'DELETE' && path === `/${apiPrefix}/discussions/:id`) return 'Discussion deleted successfully';

    // Discussion Bookmark messages
    if (method === 'POST' && path === `/${apiPrefix}/discussions/:id/bookmark`)
      return 'Discussion bookmarked successfully';
    if (method === 'DELETE' && path === `/${apiPrefix}/discussions/:id/bookmark`)
      return 'Bookmark removed successfully';
    if (method === 'GET' && path === `/${apiPrefix}/discussions/bookmarked`)
      return 'Bookmarked discussions retrieved successfully';

    // Discussion Space messages
    if (method === 'POST' && path === `/${apiPrefix}/spaces`) return 'Discussion space created successfully';
    if (method === 'GET' && path === `/${apiPrefix}/spaces`) return 'Discussion spaces retrieved successfully';
    if (method === 'GET' && path === `/${apiPrefix}/spaces/slug/:slug`)
      return 'Discussion space retrieved successfully';
    if (method === 'GET' && path === `/${apiPrefix}/spaces/:id`) return 'Discussion space retrieved successfully';
    if (method === 'PATCH' && path === `/${apiPrefix}/spaces/:id`) return 'Discussion space updated successfully';
    if (method === 'DELETE' && path === `/${apiPrefix}/spaces/:id`) return 'Discussion space deleted successfully';
    if (method === 'POST' && path === `/${apiPrefix}/spaces/:id/follow`)
      return 'Successfully followed discussion space';
    if (method === 'POST' && path === `/${apiPrefix}/spaces/:id/unfollow`)
      return 'Successfully unfollowed discussion space';
    if (method === 'GET' && path === `/${apiPrefix}/spaces/:id/is-following`)
      return 'Following status retrieved successfully';

    return 'Operation successful';
  }
}
