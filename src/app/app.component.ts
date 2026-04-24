import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './navbar'; // Zmienione z navbar.component na navbar

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Navbar], // Zmienione z NavbarComponent na Navbar
  template: `
    <app-navbar></app-navbar>
    <main class="container py-4">
      <router-outlet></router-outlet>
    </main>
  `
})
export class AppComponent { }