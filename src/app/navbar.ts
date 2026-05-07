import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from './services/api';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit {
  /** Całkowita liczba przedmiotów w koszyku */
  totalInCart: number = 0;
  /** Czy użytkownik jest obecnie zalogowany */
  isLoggedIn: boolean = false;
  /** Czy zalogowany użytkownik posiada uprawnienia administratora */
  isAdmin: boolean = false;

  constructor(
    private router: Router,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    /** 
     * Subskrypcja statusu użytkownika. 
     * Reaguje na logowanie i wylogowanie w czasie rzeczywistym.
     */
    this.api.user$.subscribe(user => {
      if (user) {
        this.isLoggedIn = true;
        // Sprawdzenie roli (case-insensitive dla bezpieczeństwa)
        this.isAdmin = user.role && user.role.toLowerCase() === 'admin';
      } else {
        this.isLoggedIn = false;
        this.isAdmin = false;
      }
    });

    /** 
     * Subskrypcja licznika koszyka.
     * Automatycznie aktualizuje badge przy zmianach w localStorage.
     */
    this.api.cart$.subscribe(count => this.totalInCart = count);
    
    // Inicjalne pobranie stanu koszyka przy starcie komponentu
    this.api.updateCartCount();
  }

  /**
   * Czyści sesję użytkownika i powiadamia aplikację o zmianie stanu.
   */
  logout(): void {
    localStorage.removeItem('user');
    
    // Powiadomienie serwisu, aby user$ wyemitował null
    this.api.updateUserStatus(); 

    // Przekierowanie na stronę główną lub logowanie
    this.router.navigate(['/login']);
  }
}