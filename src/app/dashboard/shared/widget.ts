import { GridsterItem } from 'angular-gridster2';

export class Widget {
    _id: string;
    title: string;
    description: string;
    component: string;
    resizeDirections: Array<string>;
    resizeable: boolean;
    config: WidgetConfig;
    orginalConfig: WidgetConfig;
    gridItem: GridsterItem;
}


export class WidgetConfig {
  _id: string;
  cols: number;
  rows: number;
   y: number;
   x: number;
   dragEnabled: boolean;
   resizeEnabled: boolean;
}
