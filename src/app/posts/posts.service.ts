import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Subject } from "rxjs";
import { map } from "rxjs/operators";
import { Router } from "@angular/router";

import { environment } from "../../environments/environment";
import { Post } from "./post.model";

const BACKEND_URL = environment.apiUrl + "/posts/";

@Injectable({ providedIn: "root" })
export class PostsService {
  private posts: Post[] = [];
  private postsUpdated = new Subject<{ posts: Post[]; postCount: number }>();

  constructor(private http: HttpClient, private router: Router) {}

  getPosts(postsPerPage: number, currentPage: number, showUserOnlyPosts: boolean, fractalId: string) {
    const route = showUserOnlyPosts ? "user" : "";
    let queryParams = `?pagesize=${postsPerPage}&page=${currentPage}`;
    if (fractalId != null) {
      queryParams += `&fractal=${fractalId}`;
    }
    this.http
      .get<{ message: string; posts: any; maxPosts: number }>(
        BACKEND_URL + route + queryParams
      )
      .pipe(
        map(postData => {
          return {
            posts: postData.posts.map(post => {
              return {
                title: post.title,
                xMin: post.xMin,
                xMax: post.xMax,
                yMin: post.yMin,
                yMax: post.yMax,
                xC: post.xC,
                yC: post.yC,
                contours: post.contours,
                theme: post.theme,
                iterations: post.iterations,
                size: post.size,
                fractal: post.fractal,
                id: post._id,
                imagePath: post.imagePath,
                creator: post.creator
              };
            }),
            maxPosts: postData.maxPosts
          };
        })
      )
      .subscribe(transformedPostData => {
        this.posts = transformedPostData.posts;
        this.postsUpdated.next({
          posts: [...this.posts],
          postCount: transformedPostData.maxPosts
        });
      });
  }

  getPostUpdateListener() {
    return this.postsUpdated.asObservable();
  }

  getPost(id: string) {
    return this.http.get<{
      _id: string;
      title: string;
      xMin: string;
      xMax: string;
      yMin: string;
      yMax: string;
      xC: string;
      yC: string;
      contours: string;
      theme: string;
      iterations: string;
      size: string;
      fractal: string;
      imagePath: string;
      creator: string;
    }>(BACKEND_URL + id);
  }

  addPost(title: string, xMin: string, xMax: string, yMin: string, yMax: string, xC: string, yC: string, contours: string, theme: string, iterations: string, size: string, fractal: string, image: File) {
    const postData = new FormData();
    postData.append("title", title);
    postData.append("xMin", xMin);
    postData.append("xMax", xMax);
    postData.append("yMin", yMin);
    postData.append("yMax", yMax);
    postData.append("xC", xC);
    postData.append("yC", yC);
    postData.append("contours", contours);
    postData.append("theme", theme);
    postData.append("iterations", iterations);
    postData.append("size", size);
    postData.append("fractal", fractal);
    postData.append("image", image);
    this.http
      .post<{ message: string; post: Post }>(
        BACKEND_URL,
        postData
      )
      .subscribe(responseData => {
        this.router.navigate(["/view/" + responseData.post.id]);
      });
  }

  updatePost(id: string, title: string, xMin: string, xMax: string, yMin: string, yMax: string, xC: string, yC: string, contours: string, theme: string, iterations: string, size: string, fractal: string, image: File | string) {
    let postData: Post | FormData;
    if (typeof image === "object") {
      postData = new FormData();
      postData.append("id", id);
      postData.append("title", title);
      postData.append("xMin", xMin);
      postData.append("xMax", xMax);
      postData.append("yMin", yMin);
      postData.append("yMax", yMax);
      postData.append("xC", xC);
      postData.append("yC", yC);
      postData.append("contours", contours);
      postData.append("theme", theme);
      postData.append("iterations", iterations);
      postData.append("size", size);
      postData.append("fractal", fractal);
      postData.append("image", image);
    } else {
      postData = {
        id: id,
        title: title,
        xMin: xMin,
        xMax: xMax,
        yMin: yMin,
        yMax: yMax,
        xC: xC,
        yC: yC,
        contours: contours,
        theme: theme,
        iterations: iterations,
        size: size,
        fractal: fractal,
        imagePath: image,
        creator: null
      };
    }
    this.http
      .put(BACKEND_URL + id, postData)
      .subscribe(response => {
        this.router.navigate(["/view/" + id]);
      });
  }

  deletePost(postId: string) {
    return this.http.delete(BACKEND_URL + postId);
  }
}
