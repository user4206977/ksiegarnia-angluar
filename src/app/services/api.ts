import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  /** Adres bazowy API */
  private apiUrl = 'http://192.168.254.110:3000/ksiegarnia-api'; 

  /** Strumień danych o zalogowanym użytkowniku */
  private userSubject = new BehaviorSubject<any>(JSON.parse(localStorage.getItem('user') || 'null'));
  user$ = this.userSubject.asObservable();

  /** Strumień przechowujący liczbę przedmiotów w koszyku */
  private cartSubject = new BehaviorSubject<number>(0);
  cart$ = this.cartSubject.asObservable();

  constructor(private http: HttpClient) { 
    this.updateCartCount();
  }

  // --- OBSŁUGA STATUSU I KOSZYKA ---

  /**
   * Odświeża status użytkownika w aplikacji na podstawie danych z localStorage
   * oraz przelicza koszyk dla danego profilu.
   */
  updateUserStatus(): void {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    this.userSubject.next(user);
    this.updateCartCount();
  }

  /**
   * Oblicza sumaryczną ilość produktów w koszyku zapisanym w localStorage.
   * Rozróżnia koszyk gościa oraz zalogowanego użytkownika.
   */
  updateCartCount(): void {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const cartKey = user.id ? `cart_${user.id}` : 'cart_guest';
    const cart = JSON.parse(localStorage.getItem(cartKey) || '{}');
    
    // Obliczanie sumy ilości produktów w obiekcie koszyka
    const count = Object.values(cart).reduce((a: any, b: any) => a + (b as number), 0) as number;
    this.cartSubject.next(count);
  }

  // --- KSIĄŻKI ---

  /** Pobiera listę wszystkich dostępnych książek */
  getBooks(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/books`);
  }

  /** Pobiera szczegółowe dane jednej książki na podstawie ID */
  getBook(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/books/${id}`);
  }

  // --- ZAMÓWIENIA ---

  /** Przesyła dane nowego zamówienia do serwera */
  placeOrder(orderData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/orders`, orderData);
  }

  /** Pobiera listę zamówień przypisanych do konkretnego użytkownika */
  getMyOrders(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/my-orders/${userId}`);
  }

  // --- UŻYTKOWNIK ---

  /** Wysyła prośbę o zmianę hasła użytkownika */
  changePassword(passData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/change-password`, passData);
  }

  // --- ADMIN: UŻYTKOWNICY ---

  /** Pobiera listę wszystkich użytkowników (tylko dla admina) */
  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/users`);
  }

  /** Zmienia uprawnienia wybranego użytkownika */
  updateUserRole(userId: number, newRole: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/admin/users/role`, { userId, newRole });
  }

  /** Usuwa konto użytkownika z systemu */
  deleteUser(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/admin/users/${id}`);
  }

  // --- ADMIN: MAGAZYN ---

  /** Aktualizuje dane istniejącej książki */
  updateBook(id: number, bookData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/admin/books/${id}`, bookData);
  }

  /** Usuwa książkę z bazy danych */
  deleteBook(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/admin/books/${id}`);
  }

  /** Dodaje nową książkę do bazy (obsługuje przesyłanie plików) */
  addBook(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/admin/books`, formData);
  }

  /** Pobiera listę wszystkich zamówień w systemie dla panelu administracyjnego */
  getAllOrdersAdmin(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/orders`);
  }

  /** Zmienia status realizacji zamówienia (np. na 'wysłane') */
  updateOrderStatus(orderId: number, newStatus: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/orders/status`, { orderId, newStatus });
  }

  /** Usuwa zamówienie z systemu */
  deleteOrder(orderId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/orders/${orderId}`);
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>('http://192.168.254.110:3000/ksiegarnia-api/login', credentials);
  }

  register(userData: any) {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }
}