import { Pipe, PipeTransform } from "@angular/core";

import { formatCoordinate, formatCoordinateRange } from "./coordinate-math";

@Pipe({ name: "coordinateRange" })
export class CoordinateRangePipe implements PipeTransform {
  transform(min: string, max: string, side: "min" | "max"): string {
    const range = formatCoordinateRange(min, max);
    return side === "min" ? range.min : range.max;
  }
}

@Pipe({ name: "coordinateValue" })
export class CoordinateValuePipe implements PipeTransform {
  transform(value: string): string {
    return value == null || value === "" ? "" : formatCoordinate(value);
  }
}
