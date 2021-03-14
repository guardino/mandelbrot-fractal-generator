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
  showAdvancedPanel = false;

  iterationList = [
    { value:  "512" },
    { value: "1024" },
    { value: "2048" },
    { value: "4096" },
    { value: "8192" }
  ];

  sizeList = [
    { value:  "512" },
    { value: "1024" },
    { value: "2048" },
    { value: "4096" }
  ];

  contourList = [
    { value: "32" },
    { value: "64" },
    { value: "128" },
    { value: "256" },
    { value: "512" }
  ];

  themes = [
    { name: "Bubblegum", value:  "1" },
    { name: "Candy",     value:  "2" },
    { name: "Cosmic",    value:  "3" },
    { name: "Fire",      value:  "4" },
    { name: "Floral",    value:  "5" },
    { name: "Hot",       value:  "6" },
    { name: "Imperial",  value:  "7" },
    { name: "Ocean",     value:  "8" },
    { name: "Rainbow",   value:  "9" },
    { name: "Volcano",   value: "10" }
  ];

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
      contours : new FormControl(null, { validators: [Validators.required] }),
      theme : new FormControl(null, { validators: [Validators.required] }),
      iterations : new FormControl(null, { validators: [Validators.required] }),
      size : new FormControl(null, { validators: [Validators.required] })
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
            contours: postData.contours,
            theme: postData.theme,
            iterations: postData.iterations,
            size: postData.size,
            imagePath: postData.imagePath,
            creator: postData.creator
          };
          this.form.setValue({
            title: this.post.title,
            xMin: this.post.xMin,
            xMax: this.post.xMax,
            yMin: this.post.yMin,
            yMax: this.post.yMax,
            contours: this.post.contours != null ? this.post.contours : this.contourList[1].value,
            theme: this.post.theme != null ? this.post.theme : this.themes[9].value,
            iterations: this.post.iterations != null ? this.post.iterations : this.iterationList[1].value,
            size: this.post.size != null ? this.post.size : this.sizeList[2].value
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
          yMax: 1.3,
          contours: this.contourList[1].value,
          theme: this.themes[2].value,
          iterations: this.iterationList[2].value,
          size: this.sizeList[1].value
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
        this.form.value.contours,
        this.form.value.theme,
        this.form.value.iterations,
        this.form.value.size,
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
        this.form.value.contours,
        this.form.value.theme,
        this.form.value.iterations,
        this.form.value.size,
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
      yMax: yMax,
      contours: this.form.value.contours,
      theme: this.form.value.theme,
      iterations: this.form.value.iterations,
      size: this.form.value.size
    });
  }

  toggleAdvancedPanel() {
    this.showAdvancedPanel = !this.showAdvancedPanel;
  }
}
