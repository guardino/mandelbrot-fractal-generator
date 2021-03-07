import { Component, AfterViewInit, ViewChild, ElementRef, Input, Output, EventEmitter } from "@angular/core";

// Code in this class is a modified version of the sample in https://stackoverflow.com/questions/47879692/angular2-draw-rectangle-on-canvas-with-mouse

@Component({
  selector:'app-canvas-image',
  template:`                    
        <canvas #myCanvas (mousedown)="mdEvent($event)" (mouseup)="muEvent($event)" (mousemove)="mmEvent($event)"></canvas>
    `,
  styleUrls: ["./canvas.component.css"]
})
export class CanvasComponent implements AfterViewInit {

  @Input() imageUrl;

  @Output() messageEvent = new EventEmitter<number[]>();

  startX:number=null;
  startY:number=null;
  drag=false;

  @ViewChild("myCanvas") myCanvas:ElementRef;

  mdEvent(e){
    //persist starting position
    this.startX=e.clientX;
    this.startY=e.clientY;
    this.drag=true;
  }


  mmEvent(e) {
    if (this.drag) {
      //redraw image on canvas
      let base_image = new Image();
      base_image.src = this.imageUrl;
      let context: CanvasRenderingContext2D = this.myCanvas.nativeElement.getContext("2d");
      let sx = this.startX;
      let sy = this.startY;

      let canvasTop    = this.myCanvas.nativeElement.getBoundingClientRect().top;
      let canvasBottom = this.myCanvas.nativeElement.getBoundingClientRect().bottom;
      let canvasLeft   = this.myCanvas.nativeElement.getBoundingClientRect().left;
      let canvasRight  = this.myCanvas.nativeElement.getBoundingClientRect().right;

      base_image.onload = function () {
        context.canvas.height = base_image.height;
        context.canvas.width  = base_image.width;
        context.drawImage(base_image, 0, 0);

        //draw rectangle on canvas
        let x = sx - canvasLeft;
        let y = sy - canvasTop;
        let w = e.clientX - canvasLeft - x;
        let h = e.clientY - canvasTop - y;
        x = x * base_image.width  / (canvasRight - canvasLeft);
        w = w * base_image.width  / (canvasRight - canvasLeft);
        y = y * base_image.height / (canvasBottom - canvasTop);
        h = h * base_image.height / (canvasBottom - canvasTop);
        context.setLineDash([1, 1]);
        context.lineWidth = 3;
        context.strokeStyle = "white";
        context.strokeRect(x, y, w, h);
      };
    }
  }

  muEvent(e) {
    let base_image = new Image();
    base_image.src = this.imageUrl;
    let canvasTop    = this.myCanvas.nativeElement.getBoundingClientRect().top;
    let canvasBottom = this.myCanvas.nativeElement.getBoundingClientRect().bottom;
    let canvasLeft   = this.myCanvas.nativeElement.getBoundingClientRect().left;
    let canvasRight  = this.myCanvas.nativeElement.getBoundingClientRect().right;
    //draw final rectangle on canvas
    let x = this.startX - this.myCanvas.nativeElement.getBoundingClientRect().left;
    let y = this.startY - this.myCanvas.nativeElement.getBoundingClientRect().top;
    let w = e.clientX   - this.myCanvas.nativeElement.getBoundingClientRect().left - x;
    let h = e.clientY   - this.myCanvas.nativeElement.getBoundingClientRect().top - y;
    x = x * base_image.width  / (canvasRight - canvasLeft);
    w = w * base_image.width  / (canvasRight - canvasLeft);
    y = y * base_image.height / (canvasBottom - canvasTop);
    h = h * base_image.height / (canvasBottom - canvasTop);
    this.myCanvas.nativeElement.getContext("2d").setLineDash([]);
    this.myCanvas.nativeElement.getContext("2d").strokeRect(x, y, w, h);

    this.drag=false;

    let a = w > 0 ? x : x + w;
    let b = h > 0 ? y : y + h;
    let c = w > 0 ? x + w : x;
    let d = h > 0 ? y + h : y;
    let range: number[] = [a, b, c, d, base_image.width, base_image.height];
    this.messageEvent.emit(range);
  }

  ngAfterViewInit() {
    //draw image on canvas
    let base_image = new Image();
    base_image.src = this.imageUrl;
    let context: CanvasRenderingContext2D = this.myCanvas.nativeElement.getContext("2d");
    base_image.onload = function(){
      context.canvas.height = base_image.height;
      context.canvas.width  = base_image.width;
      context.drawImage(base_image, 0, 0);
    }
  }

}
