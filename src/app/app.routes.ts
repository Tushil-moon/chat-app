import { Routes } from '@angular/router';
import { ChatComponent } from './Modules/chat/pages/chat/chat.component';
import { LoginComponent } from './Modules/auth/pages/login/login.component';
import { RegisterComponent } from './Modules/auth/pages/register/register.component';
import { authGuard } from './Guards/Auth/auth.guard';
import { protectedGuard } from './Guards/Auth/protected.guard';

export const routes: Routes = [
  { path: 'chat', component: ChatComponent, canActivate: [authGuard] },
  { path: 'login', component: LoginComponent, canActivate: [protectedGuard] },
  { path: 'register', component: RegisterComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login', pathMatch: 'full' },
];
