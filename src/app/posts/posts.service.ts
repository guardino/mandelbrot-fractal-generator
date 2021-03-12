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

  getPosts(postsPerPage: number, currentPage: number, showUserOnlyPosts: boolean) {
    const route = showUserOnlyPosts ? "user" : "";
    const queryParams = `?pagesize=${postsPerPage}&page=${currentPage}`;
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
                contours: post.contours,
                theme: post.theme,
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
      contours: string;
      theme: string;
      imagePath: string;
      creator: string;
    }>(BACKEND_URL + id);
  }

  addPost(title: string, xMin: string, xMax: string, yMin: string, yMax: string, contours: string, theme: string, image: File) {
    const postData = new FormData();
    postData.append("title", title);
    postData.append("xMin", xMin);
    postData.append("xMax", xMax);
    postData.append("yMin", yMin);
    postData.append("yMax", yMax);
    postData.append("contours", contours);
    postData.append("theme", theme);
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

  updatePost(id: string, title: string, xMin: string, xMax: string, yMin: string, yMax: string, contours: string, theme: string, image: File | string) {
    let postData: Post | FormData;
    if (typeof image === "object") {
      postData = new FormData();
      postData.append("id", id);
      postData.append("title", title);
      postData.append("xMin", xMin);
      postData.append("xMax", xMax);
      postData.append("yMin", yMin);
      postData.append("yMax", yMax);
      postData.append("contours", contours);
      postData.append("theme", theme);
      postData.append("image", image);
    } else {
      postData = {
        id: id,
        title: title,
        xMin: xMin,
        xMax: xMax,
        yMin: yMin,
        yMax: yMax,
        contours: contours,
        theme: theme,
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
