import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

// Angular Material
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';

// Nebular Modules
import { NbToastrModule, NbThemeModule, NbLayoutModule, NbSidebarModule, NbMenuModule, NbContextMenuModule, NbUserModule, NbSpinnerModule, NbButtonModule, NbIconModule } from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';

// Componentes e Rotas
import { AppComponent } from './app.component';
import { ToolbarMenuComponent } from './shared/components/toolbar-menu/toolbar-menu.component';
import { AppRoutingModule } from './app-routing.module';

// Interceptors
import { AuthInterceptor } from './shared/interceptors/auth.interceptor'; 
import { LoadingInterceptor } from './shared/interceptors/loading.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    ToolbarMenuComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    MatSnackBarModule,
    BrowserAnimationsModule,
    RouterModule,
    AppRoutingModule,
    NbToastrModule.forRoot(),
    
    // Angular Material
    MatProgressSpinnerModule,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatMenuModule,
    MatListModule,
    MatDividerModule,
    MatTooltipModule,

    // Nebular
    NbThemeModule.forRoot({ name: 'default' }),
    NbLayoutModule,
    NbContextMenuModule,
    NbSidebarModule.forRoot(), // Importante para o NbSidebarService funcionar
    NbMenuModule.forRoot(),    // Importante para o <nb-menu> funcionar
    NbUserModule,
    NbIconModule,
    NbButtonModule,
    NbSpinnerModule,
    NbEvaIconsModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoadingInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }