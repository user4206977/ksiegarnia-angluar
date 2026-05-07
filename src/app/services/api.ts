import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://192.168.254.110:3000/ksiegarnia-api'; 

  // Strumienie danych (Subjects)
  private userSubject = new BehaviorSubject<any>(JSON.parse(localStorage.getItem('user') || 'null'));
  user$ = this.userSubject.asObservable();

  private cartSubject = new BehaviorSubject<number>(0);
  cart$ = this.cartSubject.asObservable();

  constructor(private http: HttpClient) { 
    // Przy starcie aplikacji od razu policz koszyk
    this.updateCartCount();
  }

  // --- OBSŁUGA STATUSU I KOSZYKA ---

  updateUserStatus() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    this.userSubject.next(user);
    // Kiedy zmienia się użytkownik, koszyk MUSI się przeliczyć na nowy klucz (np. z guest na user_1)
    this.updateCartCount();
  }

  updateCartCount() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const cartKey = user.id ? `cart_${user.id}` : 'cart_guest';
    const cart = JSON.parse(localStorage.getItem(cartKey) || '{}');
    const count = Object.values(cart).reduce((a: any, b: any) => a + (b as number), 0) as number;
    this.cartSubject.next(count);
  }

  // --- KSIĄŻKI ---

  getBooks(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/books`);
  }

  getBook(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/books/${id}`);
  }

  // --- ZAMÓWIENIA ---

  placeOrder(orderData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/orders`, orderData);
  }

  getMyOrders(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/my-orders/${userId}`);
  }

  // --- UŻYTKOWNIK ---

  changePassword(passData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/change-password`, passData);
  }

  // --- ADMIN: UŻYTKOWNICY ---

  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/users`);
  }

  updateUserRole(userId: number, newRole: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/admin/users/role`, { userId, newRole });
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/admin/users/${id}`);
  }

  // --- ADMIN: MAGAZYN ---

  updateBook(id: number, bookData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/admin/books/${id}`, bookData);
  }

  deleteBook(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/admin/books/${id}`);
  }

  addBook(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/admin/books`, formData);
  }

  getAllOrdersAdmin(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/orders`);
  }

  updateOrderStatus(orderId: number, newStatus: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/orders/status`, { orderId, newStatus });
  }

  deleteOrder(orderId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/orders/${orderId}`);
  }
}
