import { Component, Input, OnInit } from '@angular/core';
import { AuthService } from '@app/services/auth.service';
import { MenuItem } from '@app/shared/models/menuItem';
import {  NbSidebarService } from '@nebular/theme';



@Component({
  selector: 'app-toolbar-menu',
  templateUrl: './toolbar-menu.component.html',
  styleUrls: ['./toolbar-menu.component.scss']
})
export class ToolbarMenuComponent implements OnInit {
  @Input() shadow = false;
  @Input() popText = false;
  @Input() menuTitle = '';
  @Input() items_menu: MenuItem[] = [];
  


  
  
  public userName = '';

  constructor(
    private auth: AuthService,         
    private sidebarService: NbSidebarService
) { 
  }

  ngOnInit(): void {
    this.userName = this.auth.getUser()?.userName || 'Utilizador';
  }

    toggleSidebar(): boolean {
    this.sidebarService.toggle(true, 'menu-sidebar');
    return false;
  }

  logout(): void {
    this.auth.logout();
  }
}