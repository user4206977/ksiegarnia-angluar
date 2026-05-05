import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from './services/api';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css'
})
export class Cart implements OnInit {
  cartItems: any[] = [];
  totalPrice: number = 0;
  private cartKey = 'cart_guest';

  constructor(
    private api: ApiService, 
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.api.user$.subscribe(() => {
      this.refreshCart();
    });
  }

  refreshCart() {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      this.cartKey = `cart_${user.id}`;
    } else {
      this.cartKey = 'cart_guest';
    }
    this.loadCart();
  }

  loadCart() {
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
        this.cdr.detectChanges(); // Powiadom Angulara, że dane są gotowe do wyświetlenia
      },
      error: (err) => console.error("Błąd API:", err)
    });
  }

  updateQty(id: number, newQty: number) {
    if (newQty < 1) return;
    let cart = JSON.parse(localStorage.getItem(this.cartKey) || '{}');
    cart[id] = newQty;
    localStorage.setItem(this.cartKey, JSON.stringify(cart));
    this.loadCart();
  }

  removeItem(id: number) {
    let cart = JSON.parse(localStorage.getItem(this.cartKey) || '{}');
    delete cart[id];
    localStorage.setItem(this.cartKey, JSON.stringify(cart));
    this.loadCart();
  }

  placeOrder() {
    const userJson = localStorage.getItem('user');
    if (!userJson) {
      this.router.navigate(['/login'], { queryParams: { msg: 'Musisz się zalogować, aby złożyć zamówienie!' } });
      return;
    }

    const user = JSON.parse(userJson);
    const orderItems = this.cartItems.map(item => ({
      book_id: Number(item.id),
      quantity: Number(item.quantity)
    }));

    const orderData = {
      user_id: user.id,
      total_sum: this.totalPrice,
      items: orderItems
    };

    this.api.placeOrder(orderData).subscribe({
      next: (res) => {
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

  trackByFn(index: number, item: any) {
    return item.id;
  }
}