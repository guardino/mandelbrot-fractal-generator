import { Component, AfterViewInit, ViewChild, ElementRef, Input, Output, EventEmitter } from "@angular/core";

@Component({
  selector:'app-canvas-image',
  template:`
        <canvas #myCanvas
          (pointerdown)="onPointerDown($event)"
          (pointermove)="onPointerMove($event)"
          (pointerup)="onPointerUp($event)"
          (pointercancel)="onPointerCancel()"></canvas>
    `,
  styleUrls: ["./canvas.component.css"]
})
export class CanvasComponent implements AfterViewInit {

  @Input() imageUrl;

  @Output() messageEvent = new EventEmitter<number[]>();

  private startX: number;
  private startY: number;
  private drag = false;
  private baseImage: HTMLImageElement;

  @ViewChild("myCanvas") myCanvas:ElementRef;

  onPointerDown(event: PointerEvent) {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0) || !this.isImageReady()) {
      return;
    }

    const point = this.getCanvasPoint(event);
    this.startX = point.x;
    this.startY = point.y;
    this.drag = true;
    this.myCanvas.nativeElement.setPointerCapture(event.pointerId);
  }

  onPointerMove(event: PointerEvent) {
    if (this.drag) {
      this.drawSelection(this.getCanvasPoint(event), true);
    }
  }

  onPointerUp(event: PointerEvent) {
    if (!this.drag || !this.isImageReady()) {
      return;
    }

    const point = this.getCanvasPoint(event);
    this.drawSelection(point, false);
    this.drag=false;

    const left = Math.min(this.startX, point.x);
    const top = Math.min(this.startY, point.y);
    const right = Math.max(this.startX, point.x);
    const bottom = Math.max(this.startY, point.y);
    const range: number[] = [
      left, top, right, bottom, this.baseImage.naturalWidth, this.baseImage.naturalHeight
    ];
    this.messageEvent.emit(range);
  }

  onPointerCancel() {
    this.drag = false;
    this.drawBaseImage();
  }

  ngAfterViewInit() {
    this.baseImage = new Image();
    this.baseImage.onload = () => {
      this.myCanvas.nativeElement.width = this.baseImage.naturalWidth;
      this.myCanvas.nativeElement.height = this.baseImage.naturalHeight;
      this.drawBaseImage();
    };
    this.baseImage.src = this.imageUrl;
  }

  private isImageReady(): boolean {
    return !!this.baseImage && this.baseImage.complete && this.baseImage.naturalWidth > 0;
  }

  private getCanvasPoint(event: PointerEvent): { x: number, y: number } {
    const canvas = this.myCanvas.nativeElement;
    const bounds = canvas.getBoundingClientRect();
    const x = (event.clientX - bounds.left) * canvas.width / bounds.width;
    const y = (event.clientY - bounds.top) * canvas.height / bounds.height;

    return {
      x: Math.max(0, Math.min(canvas.width, x)),
      y: Math.max(0, Math.min(canvas.height, y))
    };
  }

  private drawBaseImage() {
    const context: CanvasRenderingContext2D = this.myCanvas.nativeElement.getContext("2d");
    context.drawImage(this.baseImage, 0, 0);
  }

  private drawSelection(point: { x: number, y: number }, isPreview: boolean) {
    this.drawBaseImage();

    const context: CanvasRenderingContext2D = this.myCanvas.nativeElement.getContext("2d");
    context.setLineDash(isPreview ? [1, 1] : []);
    context.lineWidth = 3;
    context.strokeStyle = "white";
    context.strokeRect(this.startX, this.startY, point.x - this.startX, point.y - this.startY);
  }

}
