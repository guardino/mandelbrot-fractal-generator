import { Component, OnInit, OnDestroy } from "@angular/core";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { ActivatedRoute, ParamMap } from "@angular/router";
import { Subscription } from "rxjs";

import { PostsService } from "../posts.service";
import { Post } from "../post.model";
import { mimeType } from "./mime-type.validator";
import { AuthService } from "../../auth/auth.service";

@Component({
  selector: "app-post-create",
  templateUrl: "./post-create.component.html",
  styleUrls: ["./post-create.component.css"]
})
export class PostCreateComponent implements OnInit, OnDestroy {
  enteredTitle = "";
  enteredContent = "";
  post: Post;
  isLoading = false;
  form: FormGroup;
  private mode = "create";
  private postId: string;
  private authStatusSub: Subscription;

  private xMinInit;
  private xMaxInit;
  private yMinInit;
  private yMaxInit;

  constructor(
    public postsService: PostsService,
    public route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.authStatusSub = this.authService
      .getAuthStatusListener()
      .subscribe(authStatus => {
        this.isLoading = false;
      });
    this.form = new FormGroup({
      title: new FormControl(null, {
        validators: [Validators.required, Validators.minLength(3)]
      }),
      xMin: new FormControl(null, { validators: [Validators.required] }),
      xMax: new FormControl(null, { validators: [Validators.required] }),
      yMin: new FormControl(null, { validators: [Validators.required] }),
      yMax: new FormControl(null, { validators: [Validators.required] }),
    });
    this.route.paramMap.subscribe((paramMap: ParamMap) => {
      if (paramMap.has("postId")) {
        this.mode = "edit";
        this.postId = paramMap.get("postId");
        this.isLoading = true;
        this.postsService.getPost(this.postId).subscribe(postData => {
          this.isLoading = false;
          this.post = {
            id: postData._id,
            title: postData.title,
            xMin: postData.xMin,
            xMax: postData.xMax,
            yMin: postData.yMin,
            yMax: postData.yMax,
            imagePath: postData.imagePath,
            creator: postData.creator
          };
          this.form.setValue({
            title: this.post.title,
            xMin: this.post.xMin,
            xMax: this.post.xMax,
            yMin: this.post.yMin,
            yMax: this.post.yMax
          });
          this.xMinInit = Number(this.post.xMin);
          this.xMaxInit = Number(this.post.xMax);
          this.yMinInit = Number(this.post.yMin);
          this.yMaxInit = Number(this.post.yMax);
        });
      } else {
        this.mode = "create";
        this.postId = null;
      }
    });
  }

  onSavePost() {
    if (this.form.invalid) {
      return;
    }
    this.isLoading = true;
    if (this.mode === "create") {
      this.postsService.addPost(
        this.form.value.title,
        this.form.value.xMin,
        this.form.value.xMax,
        this.form.value.yMin,
        this.form.value.yMax,
        null
      );
    } else {
      this.postsService.updatePost(
        this.postId,
        this.form.value.title,
        this.form.value.xMin,
        this.form.value.xMax,
        this.form.value.yMin,
        this.form.value.yMax,
        null
      );
    }
    this.form.reset();
  }

  ngOnDestroy() {
    this.authStatusSub.unsubscribe();
  }

  getRange($event) {
    const nPx = 1024;
    const nPy = 768;
    const range = $event;
    let deltaX = (this.xMaxInit - this.xMinInit) / nPx;
    let deltaY = (this.yMaxInit - this.yMinInit) / nPy;
    let xMin = this.xMinInit + range[0] * deltaX;
    let xMax = this.xMinInit + range[2] * deltaX;
    let yMin = this.yMaxInit - range[3] * deltaY;
    let yMax = this.yMaxInit - range[1] * deltaY;
    this.form.setValue({
      title: this.form.value.title,
      xMin: xMin,
      xMax: xMax,
      yMin: yMin,
      yMax: yMax
    });
  }
}
