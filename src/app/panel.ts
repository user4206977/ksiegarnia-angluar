import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from './services/api';

@Component({
  selector: 'app-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './panel.html',
  styleUrl: './panel.css'
})
export class Panel implements OnInit {
  isAdmin = false;
  currentUserId = 0;
  
  passData = { old: '', new1: '', new2: '' };
  passMsg = '';
  passMsgType = '';

  userOrders: any[] = [];
  allUsers: any[] = [];
  allBooks: any[] = [];
  allOrders: any[] = []; // Nowa zmienna na zamówienia wszystkich użytkowników

  newBook = { title: '', author: '', price: 0, stock: 0 };
  selectedFile: File | null = null;

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.api.user$.subscribe(user => {
      if (user) {
        this.currentUserId = user.id;
        this.isAdmin = (user.role && user.role.toLowerCase() === 'admin');
        this.loadData();
      }
    });
  }

  loadData() {
    if (this.currentUserId > 0) {
      this.loadUserOrders();
      if (this.isAdmin) {
        this.loadAdminData();
      }
    }
  }

  loadUserOrders() {
    this.api.getMyOrders(this.currentUserId).subscribe({
      next: (res) => {
        this.userOrders = res;
        this.cdr.detectChanges(); // Wymuś odświeżenie widoku
      },
      error: (err) => console.error("Błąd zamówień", err)
    });
  }

  loadAdminData() {
    this.api.getAllUsers().subscribe(res => {
      this.allUsers = res.map(u => ({ ...u, newRole: u.role }));
      this.cdr.detectChanges(); 
    });
    this.api.getBooks().subscribe(res => {
      this.allBooks = res;
      this.cdr.detectChanges(); 
    });
    // Pobieranie wszystkich zamówień dla Admina
    this.api.getAllOrdersAdmin().subscribe(res => {
      this.allOrders = res;
      this.cdr.detectChanges();
    });
  }

  changePassword(e: Event) {
    e.preventDefault();
    if (this.passData.new1 !== this.passData.new2) {
      this.passMsg = "Hasła nie są identyczne!";
      this.passMsgType = 'error';
      return;
    }
    this.api.changePassword({
      userId: this.currentUserId,
      oldPass: this.passData.old,
      newPass: this.passData.new1
    }).subscribe({
      next: () => {
        this.passMsg = "Hasło zmienione!";
        this.passMsgType = 'success';
        this.passData = { old: '', new1: '', new2: '' };
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.passMsg = err.error?.message || "Błąd zmiany hasła!";
        this.passMsgType = 'error';
        this.cdr.detectChanges();
      }
    });
  }

  getStatusClass(status: string) {
    if (!status) return 'bg-secondary';
    const s = status.toUpperCase();
    if (s.includes('ANULOWANE')) return 'bg-danger';
    if (s.includes('REALIZACJI')) return 'bg-warning text-dark';
    if (s.includes('DO ODBIORU')) return 'bg-info text-dark';
    if (s.includes('ZREALIZOWANE')) return 'bg-success';
    return 'bg-secondary';
  }

  updateUserRole(user: any) {
    this.api.updateUserRole(user.id, user.newRole).subscribe(() => {
      alert("Rola zaktualizowana!");
      this.loadAdminData();
    });
  }

  deleteUser(id: number) {
    if (confirm('Usunąć użytkownika?')) {
      this.api.deleteUser(id).subscribe(() => this.loadAdminData());
    }
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  addBook(e: Event) {
    e.preventDefault();
    const fd = new FormData();
    fd.append('tytul', this.newBook.title);
    fd.append('autor', this.newBook.author);
    fd.append('cena', this.newBook.price.toString());
    fd.append('stock', this.newBook.stock.toString());
    if (this.selectedFile) fd.append('foto', this.selectedFile);

    this.api.addBook(fd).subscribe(() => {
      alert("Książka dodana!");
      this.newBook = { title: '', author: '', price: 0, stock: 0 };
      this.loadAdminData();
    });
  }

  updateBook(book: any) {
    this.api.updateBook(book.id, { price: book.price, stock: book.stock }).subscribe(() => {
      alert("Zaktualizowano!");
      this.loadAdminData();
    });
  }

  deleteBook(id: number) {
    if (confirm('Usunąć książkę?')) {
      this.api.deleteBook(id).subscribe(() => this.loadAdminData());
    }
  }

  // Funkcje obsługi zamówień dla Admina
  updateOrderStatus(orderId: number, status: string) {
    this.api.updateOrderStatus(orderId, status).subscribe(() => {
      alert("Status zamówienia zmieniony!");
      this.loadAdminData();
    });
  }

  deleteOrder(id: number) {
    if (confirm('Usunąć zamówienie z bazy?')) {
      this.api.deleteOrder(id).subscribe(() => this.loadAdminData());
    }
  }
}