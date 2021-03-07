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
        if (paramMap.has("clone")) {
          this.mode = "create";
        }
        else
        {
          this.mode = "edit";
        }

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
        this.form.setValue({
          title: "",
          xMin: -2.5,
          xMax: 1.0,
          yMin: -1.3,
          yMax: 1.3
        });
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
    const range = $event;
    const nPx = range[4];
    const nPy = range[5];

    let vPx;
    let vPy;
    let startX;
    let startY;
    const ratio = (this.xMaxInit - this.xMinInit) / (this.yMaxInit - this.yMinInit);
    if (ratio < nPx / nPy) {
      vPx = ratio * nPy;
      vPy = nPy;
      startX = 0.5 * (nPx - vPx);
      startY = 0;
    }
    else {
      vPx = nPx;
      vPy = nPx / ratio;
      startX = 0;
      startY = 0.5 * (nPy - vPy);
    }

    let deltaX = (this.xMaxInit - this.xMinInit) / vPx;
    let deltaY = (this.yMaxInit - this.yMinInit) / vPy;
    let xMin = this.xMinInit + (range[0] - startX) * deltaX;
    let xMax = this.xMinInit + (range[2] - startX) * deltaX;
    let yMin = this.yMaxInit - (range[3] - startY) * deltaY;
    let yMax = this.yMaxInit - (range[1] - startY) * deltaY;
    this.form.setValue({
      title: this.form.value.title,
      xMin: xMin,
      xMax: xMax,
      yMin: yMin,
      yMax: yMax
    });
  }
}
