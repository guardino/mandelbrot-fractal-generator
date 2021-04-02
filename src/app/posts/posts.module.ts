import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";

import { PostCreateComponent } from "./post-create/post-create.component";
import { PostListComponent } from "./post-list/post-list.component";
import { PostViewComponent } from "./post-view/post-view.component";
import { CanvasComponent } from "./canvas/canvas.component";
import { AngularMaterialModule } from "../angular-material.module";
import { JuliaSettingsComponent } from "./post-create/julia-settings.component";

@NgModule({
  declarations: [PostCreateComponent, PostListComponent, PostViewComponent, CanvasComponent, JuliaSettingsComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AngularMaterialModule,
    RouterModule
  ]
})
export class PostsModule {}
