import { Component, OnInit, OnDestroy } from "@angular/core";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { ActivatedRoute, ParamMap } from "@angular/router";
import { Subscription } from "rxjs";
import { MatDialog } from "@angular/material/dialog";

import { PostsService } from "../posts.service";
import { Post } from "../post.model";
import { JuliaSettingsComponent } from "./julia-settings.component";
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
  isJulia = false;

  iterationList = [
    { value:  "512" },
    { value: "1024" },
    { value: "2048" },
    { value: "4096" },
    { value: "8192" },
    { value: "16384" },
    { value: "32768" },
    { value: "65536" }
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
  private parentId: string;
  private authStatusSub: Subscription;

  private xMinInit;
  private xMaxInit;
  private yMinInit;
  private yMaxInit;

  constructor(
    public postsService: PostsService,
    public route: ActivatedRoute,
    private authService: AuthService,
    private dialog: MatDialog
  ) {}

  setDefaultsOnCreate() {
    this.form.setValue({
      title: this.isJulia ? "Default Julia Set" : "Default Mandelbrot Set",
      xMin: this.isJulia ?   -1.5 : -2.5,
      xMax: this.isJulia ?    1.5 :  1.0,
      yMin: this.isJulia ?   -1.5 : -1.3,
      yMax: this.isJulia ?    1.5 :  1.3,
      xC:   this.isJulia ?  0.285 :  0.0,
      yC:   this.isJulia ?   0.01 :  0.0,
      contours: this.contourList[1].value,
      theme: this.themes[2].value,
      iterations: this.iterationList[2].value,
      size: this.sizeList[1].value,
      fractal: this.isJulia ? "2" : "1"
    });
  }

  setDefaultsOnChange() {
    this.form.setValue({
      title: this.isJulia ? "Example Julia Set" : "Example Mandelbrot Set",
      xMin: this.isJulia ?   -1.5 : -2.5,
      xMax: this.isJulia ?    1.5 :  1.0,
      yMin: this.isJulia ?   -1.5 : -1.3,
      yMax: this.isJulia ?    1.5 :  1.3,
      xC: this.isJulia ? 0.5 * (Number(this.form.value.xMin) + Number(this.form.value.xMax)) : 0.0,
      yC: this.isJulia ? 0.5 * (Number(this.form.value.yMin) + Number(this.form.value.yMax)) : 0.0,
      contours: this.form.value.contours,
      theme: this.form.value.theme,
      iterations: this.form.value.iterations,
      size: this.form.value.size,
      fractal: this.isJulia ? "2" : "1"
    });
  }

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
      xC: new FormControl(null, { validators: [Validators.required] }),
      yC: new FormControl(null, { validators: [Validators.required] }),
      contours : new FormControl(null, { validators: [Validators.required] }),
      theme : new FormControl(null, { validators: [Validators.required] }),
      iterations : new FormControl(null, { validators: [Validators.required] }),
      size : new FormControl(null, { validators: [Validators.required] }),
      fractal: new FormControl('', { validators: [Validators.required] })
    });
    this.route.paramMap.subscribe((paramMap: ParamMap) => {
      if (paramMap.has("postId")) {
        if (paramMap.has("clone")) {
          this.mode = "clone";
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
            parentId: postData.parentId,
            title: postData.title,
            xMin: postData.xMin,
            xMax: postData.xMax,
            yMin: postData.yMin,
            yMax: postData.yMax,
            xC: postData.xC,
            yC: postData.yC,
            contours: postData.contours,
            theme: postData.theme,
            iterations: postData.iterations,
            size: postData.size,
            fractal: postData.fractal,
            imagePath: postData.imagePath,
            creator: postData.creator
          };

          this.isJulia = this.post.fractal != null && this.post.fractal == "2" ? true : false;
          this.parentId = this.post.parentId;

          this.form.setValue({
            title: this.post.title,
            xMin: this.post.xMin,
            xMax: this.post.xMax,
            yMin: this.post.yMin,
            yMax: this.post.yMax,
            xC: this.post.xC != null ? this.post.xC : "0.0",
            yC: this.post.yC != null ? this.post.yC : "0.0",
            contours: this.post.contours != null ? this.post.contours : this.contourList[1].value,
            theme: this.post.theme != null ? this.post.theme : this.themes[9].value,
            iterations: this.post.iterations != null ? this.post.iterations : this.iterationList[1].value,
            size: this.post.size != null ? this.post.size : this.sizeList[2].value,
            fractal: this.post.fractal != null ? this.post.fractal : "1"
          });
          this.xMinInit = Number(this.post.xMin);
          this.xMaxInit = Number(this.post.xMax);
          this.yMinInit = Number(this.post.yMin);
          this.yMaxInit = Number(this.post.yMax);
        });
      } else {
        this.mode = "create";
        this.postId = null;
        this.setDefaultsOnCreate();
      }
    });
  }

  onSavePost() {
    if (this.form.invalid) {
      return;
    }
    this.isLoading = true;
    if (this.mode === "create" || this.mode === "clone") {
      this.postsService.addPost(
        this.mode === "clone" ? this.postId : null,
        this.form.value.title,
        this.form.value.xMin,
        this.form.value.xMax,
        this.form.value.yMin,
        this.form.value.yMax,
        this.form.value.xC,
        this.form.value.yC,
        this.form.value.contours,
        this.form.value.theme,
        this.form.value.iterations,
        this.form.value.size,
        this.form.value.fractal,
        null
      );
    } else {
      this.postsService.updatePost(
        this.postId,
        this.parentId,
        this.form.value.title,
        this.form.value.xMin,
        this.form.value.xMax,
        this.form.value.yMin,
        this.form.value.yMax,
        this.form.value.xC,
        this.form.value.yC,
        this.form.value.contours,
        this.form.value.theme,
        this.form.value.iterations,
        this.form.value.size,
        this.form.value.fractal,
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
      xC: this.form.value.xC,
      yC: this.form.value.yC,
      contours: this.form.value.contours,
      theme: this.form.value.theme,
      iterations: this.form.value.iterations,
      size: this.form.value.size,
      fractal: this.form.value.fractal
    });
  }

  changeFractal(e) {
    this.isJulia = (e.value === "2");

    if (this.mode === "create") {
      this.setDefaultsOnCreate();
    }
    else {
      this.setDefaultsOnChange();
    }

    if (this.isJulia) {
      this.dialog.open(JuliaSettingsComponent);
    }
  }

  toggleAdvancedPanel() {
    this.showAdvancedPanel = !this.showAdvancedPanel;
  }
}
