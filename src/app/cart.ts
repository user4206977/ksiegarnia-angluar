import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from './services/api';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css'
})
export class Cart implements OnInit, OnDestroy {
  cartItems: any[] = [];
  totalPrice: number = 0;
  private cartKey = 'cart_guest';
  /** Subject służący do automatycznego odpinania subskrypcji */
  private destroy$ = new Subject<void>();

  constructor(
    private api: ApiService, 
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    /** 
     * Reagujemy na zmiany statusu użytkownika. 
     * takeUntil(this.destroy$) zapobiega wyciekom pamięci.
     */
    this.api.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.refreshCart();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Ustala klucz koszyka na podstawie zalogowanego użytkownika 
   * i inicjuje ładowanie danych.
   */
  refreshCart(): void {
    const userJson = localStorage.getItem('user');
    this.cartKey = userJson ? `cart_${JSON.parse(userJson).id}` : 'cart_guest';
    this.loadCart();
  }

  /**
   * Pobiera dane o produktach z serwera i paruje je z ilościami z localStorage.
   */
  loadCart(): void {
    const rawData = localStorage.getItem(this.cartKey);
    const cart = JSON.parse(rawData || '{}');
    const idsInCart = Object.keys(cart);
    
    this.cartItems = [];
    this.totalPrice = 0;

    if (idsInCart.length === 0) {
      this.api.updateCartCount();
      this.cdr.detectChanges();
      return;
    }

    this.api.getBooks().subscribe({
      next: (books) => {
        const tempItems: any[] = [];
        let tempTotal = 0;

        idsInCart.forEach(idStr => {
          const book = books.find((b: any) => b.id == idStr); 
          if (book) {
            const quantity = cart[idStr];
            tempItems.push({ ...book, quantity: quantity });
            tempTotal += book.price * quantity;
          }
        });

        this.cartItems = tempItems;
        this.totalPrice = tempTotal;
        this.api.updateCartCount();
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Błąd pobierania produktów do koszyka:", err)
    });
  }

  /** Aktualizuje ilość wybranego produktu w pamięci lokalnej */
  updateQty(id: number, newQty: number): void {
    if (newQty < 1) return;
    let cart = JSON.parse(localStorage.getItem(this.cartKey) || '{}');
    cart[id] = newQty;
    localStorage.setItem(this.cartKey, JSON.stringify(cart));
    this.loadCart();
  }

  /** Usuwa produkt z koszyka */
  removeItem(id: number): void {
    let cart = JSON.parse(localStorage.getItem(this.cartKey) || '{}');
    delete cart[id];
    localStorage.setItem(this.cartKey, JSON.stringify(cart));
    this.loadCart();
  }

  /** Składa zamówienie i czyści koszyk po sukcesie */
  placeOrder(): void {
    const userJson = localStorage.getItem('user');
    if (!userJson) {
      this.router.navigate(['/login'], { 
        queryParams: { msg: 'Musisz się zalogować, aby złożyć zamówienie!' } 
      });
      return;
    }

    const user = JSON.parse(userJson);
    const orderData = {
      user_id: user.id,
      total_sum: this.totalPrice,
      items: this.cartItems.map(item => ({
        book_id: Number(item.id),
        quantity: Number(item.quantity)
      }))
    };

    this.api.placeOrder(orderData).subscribe({
      next: () => {
        localStorage.removeItem(this.cartKey);
        this.api.updateCartCount();
        alert("✅ Zamówienie zostało złożone pomyślnie!");
        this.router.navigate(['/panel']);
      },
      error: (err) => {
        const errorMsg = err.error?.message || err.message || "Błąd serwera";
        alert("❌ Błąd podczas składania zamówienia: " + errorMsg);
        this.cdr.detectChanges();
      }
    });
  }

  /** Optymalizacja renderowania listy ngFor */
  trackByFn(index: number, item: any): any {
    return item.id;
  }
}