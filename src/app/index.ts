import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
  /** Pełna lista książek pobrana z serwera */
  books: any[] = [];
  /** Lista książek po zastosowaniu filtrów i sortowania */
  filteredBooks: any[] = []; 
  /** Fraza wyszukiwania wpisana przez użytkownika */
  searchTerm: string = '';
  /** Aktualny tryb sortowania */
  sortBy: string = 'alpha'; 
  
  /** Obiekt przechowujący wybraną ilość dla każdej książki (klucz to ID książki) */
  quantities: { [key: number]: number } = {};
  /** Treść komunikatu zwrotnego */
  msg: string = '';
  /** ID ostatnio modyfikowanej książki (do wyświetlania komunikatów) */
  lastAddedId: number | null = null;

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadBooks();
  }

  /** Pobiera dane z API i inicjuje widok */
  loadBooks(): void {
    this.api.getBooks().subscribe({
      next: (data) => {
        this.books = data;
        // Inicjalizacja domyślnej ilości (1) dla każdej książki
        data.forEach(b => {
          if (!this.quantities[b.id]) this.quantities[b.id] = 1;
        });
        this.applyFilters();
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Błąd ładowania książek:", err)
    });
  }

  /**
   * Główna logika filtrowania i sortowania.
   * Wywoływana przy każdej zmianie w polu wyszukiwania lub selectu.
   */
  applyFilters(): void {
    let tempBooks = [...this.books];

    // 1. Filtrowanie po tytule i autorze
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      tempBooks = tempBooks.filter(b => 
        b.title.toLowerCase().includes(term) || 
        (b.author && b.author.toLowerCase().includes(term))
      );
    }

    // 2. Sortowanie wyników
    switch (this.sortBy) {
      case 'price-asc':
        tempBooks.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        tempBooks.sort((a, b) => b.price - a.price);
        break;
      case 'alpha':
        tempBooks.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        // Opcjonalnie: domyślne sortowanie (np. po ID)
        break;
    }
    
    this.filteredBooks = tempBooks;
    this.cdr.detectChanges();
  }

  /** Oblicza ile sztuk danej książki można jeszcze dodać do koszyka */
  getAvailable(book: any): number {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const cartKey = user.id ? `cart_${user.id}` : 'cart_guest';
    const cart = JSON.parse(localStorage.getItem(cartKey) || '{}');
    const inCart = cart[book.id] || 0;
    return book.stock - inCart;
  }

  /** Zmienia wybraną ilość w selektorze (przyciski + i -) */
  changeQty(book: any, delta: number): void {
    const current = this.quantities[book.id] || 1;
    const available = this.getAvailable(book);
    const newVal = current + delta;
    
    if (newVal >= 1 && newVal <= available) {
      this.quantities[book.id] = newVal;
    }
  }

  /** Dodaje wybraną ilość książki do lokalnego magazynu (koszyka) */
  addToCart(book: any): void {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const cartKey = user.id ? `cart_${user.id}` : 'cart_guest';

    const qtyToAdd = this.quantities[book.id] || 1;
    let cart = JSON.parse(localStorage.getItem(cartKey) || '{}');
    const currentlyInCart = cart[book.id] || 0;

    if (currentlyInCart + qtyToAdd <= book.stock) {
      // Aktualizacja localStorage
      cart[String(book.id)] = currentlyInCart + qtyToAdd;
      localStorage.setItem(cartKey, JSON.stringify(cart));
      
      // Powiadomienie serwisu API o zmianie (np. odświeżenie licznika na navbarze)
      this.api.updateCartCount();

      this.showFeedback(book.id, `✅ Dodano do koszyka!`);
      
      // Reset selektora ilości do 1 po pomyślnym dodaniu
      this.quantities[book.id] = 1;
    } else {
      this.showFeedback(book.id, `❌ Brak wystarczającej ilości!`);
    }
    this.cdr.detectChanges();
  }

  /** Wyświetla czasowy komunikat przy danej karcie produktu */
  private showFeedback(bookId: number, message: string): void {
    this.msg = message;
    this.lastAddedId = bookId;
    
    setTimeout(() => {
      if (this.lastAddedId === bookId) {
        this.lastAddedId = null;
        this.cdr.detectChanges();
      }
    }, 3000);
  }
}