import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // Dodano ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from './services/api';

@Component({
  selector: 'app-index',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './index.html',
  styleUrl: './index.css'
})
export class Index implements OnInit {
  books: any[] = [];
  filteredBooks: any[] = []; 
  searchTerm: string = '';
  sortBy: string = 'alpha'; 
  
  quantities: { [key: number]: number } = {};
  msg: string = '';
  lastAddedId: number | null = null;

  // Wstrzykujemy cdr
  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.api.getBooks().subscribe({
      next: (data) => {
        console.log("Odebrano dane z serwera:", data);
        this.books = data;
        
        // Inicjalizacja ilości
        data.forEach(b => this.quantities[b.id] = 1);
        
        // Wywołujemy filtrowanie
        this.applyFilters();
        
        // KLUCZOWE: Ręczne wymuszenie odświeżenia widoku
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Błąd ładowania:", err)
    });
  }

  applyFilters() {
    let tempBooks = [...this.books]; // Startujemy od kopii wszystkich książek

    // 1. Filtrowanie
    if (this.searchTerm) {
      tempBooks = tempBooks.filter(b => 
        b.title.toLowerCase().includes(this.searchTerm.toLowerCase()) || 
        (b.author && b.author.toLowerCase().includes(this.searchTerm.toLowerCase()))
      );
    }

    // 2. Sortowanie
    if (this.sortBy === 'price-asc') {
      tempBooks.sort((a, b) => a.price - b.price);
    } else if (this.sortBy === 'price-desc') {
      tempBooks.sort((a, b) => b.price - a.price);
    } else {
      tempBooks.sort((a, b) => a.title.localeCompare(b.title));
    }
    
    this.filteredBooks = tempBooks;
    this.cdr.detectChanges(); // Powtarzamy odświeżenie po przeliczeniu filtrów
  }

  // --- Reszta metod bez zmian ---
  getAvailable(book: any) {
    const cart = JSON.parse(localStorage.getItem('cart') || '{}');
    const inCart = cart[book.id] || 0;
    return book.stock - inCart;
  }

  changeQty(book: any, delta: number) {
    const current = this.quantities[book.id] || 1;
    const available = this.getAvailable(book);
    const newVal = current + delta;
    if (newVal >= 1 && newVal <= available) {
      this.quantities[book.id] = newVal;
    }
  }

  addToCart(book: any) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const cartKey = user.id ? `cart_${user.id}` : 'cart_guest';

    const qtyToAdd = this.quantities[book.id] || 1;
    let cart = JSON.parse(localStorage.getItem(cartKey) || '{}');
    const currentlyInCart = cart[book.id] || 0;

    if (currentlyInCart + qtyToAdd <= book.stock) {
      // 1. Aktualizacja w localStorage
      cart[String(book.id)] = currentlyInCart + qtyToAdd;
      localStorage.setItem(cartKey, JSON.stringify(cart));
      
      // 2. AKTUALIZACJA WIZUALNA (zmniejszamy stock w obiekcie, który wyświetla Angular)
      book.stock -= qtyToAdd; 
      
      // 3. Powiadomienie serwisu
      this.api.updateCartCount();

      this.msg = `✅ Dodano do koszyka!`;
      this.lastAddedId = book.id;
      
      setTimeout(() => {
          this.lastAddedId = null;
          this.cdr.detectChanges();
      }, 3000);
    } else {
      this.msg = `❌ Brak towaru!`;
      this.lastAddedId = book.id;
    }
    this.cdr.detectChanges();
  }
}