import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from "@angular/common/http";
import { Injectable } from "@angular/core";
import { from, Observable, of } from "rxjs";
import { catchError } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { SessionService } from "./services/session.service";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private readonly sessionService: SessionService) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    let response: Observable<HttpEvent<any>>;
    if (req.url.startsWith(environment.userQueue)) {
      response = next.handle(
        req.clone({
          headers: req.headers.set(
            "Authorization",
            `Bearer ${localStorage.getItem("jwt")}`
          )
        })
      );
    } else {
      response = next.handle(req);
    }
    response = response.pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse) {
          if (error.status == 403) {
            return from(this.sessionService.removeUser());
          }
          return of(error);
        }
        return of(error);
      })
    );
    return response;
  }
}
