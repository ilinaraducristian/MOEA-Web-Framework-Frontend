import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from "@angular/common/http";
import { Injectable } from "@angular/core";
import { JwtHelperService } from "@auth0/angular-jwt";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";

@Injectable()
export class CustomHttpInterceptor implements HttpInterceptor {
  static NO_AUTH_URLS = [
    `${environment.backend}/queue/`,
    `${environment.backend}/public`,
    `${environment.backend}/user/login`,
    `${environment.backend}/user/register`,
    `${environment.backend}/public/getProblems`,
    `${environment.backend}/public/getAlgorithms`,
    `${environment.backend}/public/downloadProblem`,
    `${environment.backend}/public/downloadAlgorithm`,
    `${environment.backend}/public/getProblemsAndAlgorithm`
  ];

  constructor(private readonly _jwtHelperService: JwtHelperService) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (request.url.match(new RegExp())) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${this._jwtHelperService.tokenGetter()}`
        }
      });
    }
    return next.handle(request);
  }
}
