import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-post-list',
    templateUrl: './post-list.component.html',
    styleUrls: ['./post-list.component.css']
})
export class PostListComponent {
    //posts = [
    //    { title: "First post", content: "This is the first post's content" },
    //    { title: "Second post", content: "This is the second post's content" },
    //    { title: "Third post", content: "This is the third post's content" }
    //];
    @Input() posts = [];
}
