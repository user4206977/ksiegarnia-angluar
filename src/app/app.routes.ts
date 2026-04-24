import { Routes } from '@angular/router';
import { Index } from './index';
import { Login } from './login';
import { Register } from './register';
import { Cart } from './cart';
import { Panel } from './panel';

export const routes: Routes = [
  { path: '', component: Index },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'cart', component: Cart },
  { path: 'panel', component: Panel },
  { path: '**', redirectTo: '' }
];