import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { UserService } from '../../modules/user/user.service';

@Injectable()
export class UserActivityInterceptor implements NestInterceptor {
  constructor(private readonly userService: UserService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(() => {
        const request = context.switchToHttp().getRequest();
        if (request.user && request.user.id) {
          this.userService.updateLastActive(request.user.id).catch(err => {
            console.error('Failed to update user activity:', err);
          });
        }
      }),
    );
  }
}