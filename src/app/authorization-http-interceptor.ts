import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from "@angular/common/http";
import { Injectable } from "@angular/core";
import { JwtHelperService } from "@auth0/angular-jwt";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";

@Injectable()
export class AuthorizationHttpInterceptor implements HttpInterceptor {
  static AUTH_URLS = [
    `${environment.backend}/algorithm/\\w`,
    `${environment.backend}/problem/\\w`,
    `${environment.backend}/user/queue(/.+)?`,
  ];

  static REGEXP = (() => {
    let temp = AuthorizationHttpInterceptor.AUTH_URLS.map(
      (link, i) =>
        `^${link}$${
          i == AuthorizationHttpInterceptor.AUTH_URLS.length - 1 ? "" : "|"
        }`
    ).reduce((prev, current) => prev + current);
    return new RegExp(temp);
  })();

  constructor(private readonly jwtHelperService: JwtHelperService) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    let urlNeedsAuth = AuthorizationHttpInterceptor.REGEXP.test(request.url);
    if (urlNeedsAuth) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${this.jwtHelperService.tokenGetter()}`,
        },
      });
    }

    return next.handle(request);
  }
}
