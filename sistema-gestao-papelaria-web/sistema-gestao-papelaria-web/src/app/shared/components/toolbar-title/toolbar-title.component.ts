import { Component, Input, OnInit } from '@angular/core';
import { MenuItem } from '@app/shared/models/menuItem';

@Component({
  selector: 'app-toolbar-title',
  templateUrl: './toolbar-title.component.html',
  styleUrls: ['./toolbar-title.component.scss']
})
export class ToolbarTitleComponent implements OnInit {
  @Input() title: string = "";
  iconFa = '';
  iconMat = '';
  fontset = '';
    @Input() shadow = false;
    @Input() popText = false;
    @Input() menuTitle = '';
    @Input() items_menu: MenuItem[] = [];

  @Input()
  set icon(value: string) {
    if (value.includes('fa-')) {
      this.iconFa = `icon-space-mat ${value}`;
      this.fontset = 'fa';
    } else {
      this.iconMat = value;
    }
  }

  constructor() { }

  ngOnInit(): void {
  }

}
