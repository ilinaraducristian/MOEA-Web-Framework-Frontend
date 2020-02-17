import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (req.url.startsWith(environment.userQueue)) {
      const authReq = req.clone({
        headers: req.headers.set(
          "Authorization",
          `Bearer ${localStorage.getItem("jwt")}`
        )
      });
      return next.handle(authReq);
    }
    return next.handle(req);
  }
}
