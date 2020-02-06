// Modules
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
// Configurations
import {
  InjectableRxStompConfig,
  RxStompService,
  rxStompServiceFactory
} from "@stomp/ng2-stompjs";
import { myRxStompConfig } from "src/configurations/myRxStompConfig";
import { SolverService } from "../services/solver.service";
// Components
import { TestComponent } from "./test/test.component";

@NgModule({
  declarations: [TestComponent],
  imports: [CommonModule, NgbModule, ReactiveFormsModule],
  providers: [
    SolverService,
    {
      provide: InjectableRxStompConfig,
      useValue: myRxStompConfig
    },
    {
      provide: RxStompService,
      useFactory: rxStompServiceFactory,
      deps: [InjectableRxStompConfig]
    }
  ]
})
export class TestModule {}
