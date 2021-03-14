import { Component, OnInit, OnDestroy } from "@angular/core";
import { ActivatedRoute, ParamMap } from "@angular/router";
import { Subscription } from "rxjs";

import { PostsService } from "../posts.service";
import { Post } from "../post.model";
import { AuthService } from "../../auth/auth.service";
import { Router } from "@angular/router";

@Component({
  selector: "app-post-view",
  templateUrl: "./post-view.component.html",
  styleUrls: ["./post-view.component.css"]
})
export class PostViewComponent implements OnInit, OnDestroy {
  post: Post;
  isLoading = false;
  private authStatusSub: Subscription;

  constructor(
    public postsService: PostsService,
    public route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authStatusSub = this.authService
      .getAuthStatusListener()
      .subscribe(authStatus => {
        this.isLoading = false;
      });
    this.route.paramMap.subscribe((paramMap: ParamMap) => {
      const postId = paramMap.get("postId");
      this.isLoading = true;
      this.postsService.getPost(postId).subscribe(postData => {
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
      });
    });
  }

  ngOnDestroy() {
    this.authStatusSub.unsubscribe();
  }

  onDelete(postId: string) {
    this.isLoading = true;
    this.postsService.deletePost(postId).subscribe(() => {
      this.router.navigate(["/"]);
    }, () => {
      this.isLoading = false;
    });
  }
}
