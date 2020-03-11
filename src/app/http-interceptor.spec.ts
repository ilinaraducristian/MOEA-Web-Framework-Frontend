import { CustomHttpInterceptor } from "./custom-http-interceptor";

describe("HttpInterceptor", () => {
  it("should create an instance", () => {
    expect(new CustomHttpInterceptor()).toBeTruthy();
  });
});
