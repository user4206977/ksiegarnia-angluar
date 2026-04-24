import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Ważne dla *ngIf
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit {
  // Odpowiednik Twoich zmiennych z PHP
  totalInCart: number = 0;
  isLoggedIn: boolean = false;

  constructor(private router: Router) {}

  ngOnInit() {
    // Tutaj później dodamy prawdziwe sprawdzanie z serwisu
    // Na razie ustawiamy na sztywno, żebyś widział, że działa
    this.checkSession();
  }

  checkSession() {
    // Symulacja: sprawdź czy w localStorage jest użytkownik
    this.isLoggedIn = !!localStorage.getItem('user_id');
    
    // Symulacja: policz przedmioty w koszyku (później pobierzemy to z serwisu)
    const cart = JSON.parse(localStorage.getItem('cart') || '{}');
    this.totalInCart = Object.values(cart).reduce((a: any, b: any) => a + b, 0) as number;
  }

  logout() {
    localStorage.removeItem('user_id');
    this.isLoggedIn = false;
    this.router.navigate(['/login']);
  }
}