import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from './services/api'; // Zaimportuj ApiService

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit {
  totalInCart: number = 0;
  isLoggedIn: boolean = false;
  isAdmin: boolean = false;

  constructor(
    private router: Router,
    private api: ApiService // Wstrzyknij ApiService
  ) {}

  ngOnInit() {
    // SUBSKRYPCJA STATUSU UŻYTKOWNIKA
    this.api.user$.subscribe(user => {
      if (user) {
        this.isLoggedIn = true;
        this.isAdmin = user.role && user.role.toLowerCase() === 'admin';
      } else {
        this.isLoggedIn = false;
        this.isAdmin = false;
      }
    });

    this.api.cart$.subscribe(count => this.totalInCart = count);
    this.api.updateCartCount();
  }

  updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '{}');
    this.totalInCart = Object.values(cart).reduce((a: any, b: any) => a + b, 0) as number;
  }

  logout() {
    localStorage.removeItem('user');
    
    // POWIADOM API O WYLOGOWANIU
    this.api.updateUserStatus(); 

    this.router.navigate(['/login']);
    // Już nie potrzebujemy window.location.reload(), bo subskrypcja sama odświeży Navbar!
  }
}