import { CommonModule } from '@angular/common';
import { NgModule, Provider } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';

@NgModule({
  declarations: [],
  imports: [CommonModule],
  providers: [KeycloakTestingModule.forRoot()],
})
export class KeycloakTestingModule {
  static forRoot(): Provider {
    const keycloakServiceSpy = jasmine.createSpyObj('KeycloakService', [
      'login',
      'logout',
      'register',
    ]);
    return {
      provide: KeycloakService,
      useValue: keycloakServiceSpy,
    };
  }
}
