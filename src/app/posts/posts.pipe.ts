import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'reverse_sort'
})

// Derived from https://stackoverflow.com/questions/63390812/angular-orderby-pipe
export class SortPipe implements PipeTransform {
  transform(value: any, propName: string) {

    return value.sort((a, b) => {
       if (a[propName] < b[propName]) {
         return 1;
       } else if (a[propName] === b[propName]) {
         return 0;
       } else if (a[propName] > b[propName]) {
         return -1;
       }
    });

  }
}
