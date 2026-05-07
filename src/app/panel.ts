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
  allOrders: any[] = [];

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
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Błąd pobierania zamówień użytkownika", err)
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
    this.api.getAllOrdersAdmin().subscribe(res => {
      this.allOrders = res;
      this.cdr.detectChanges();
    });
  }

  changePassword(e: Event) {
    e.preventDefault();
    if (this.passData.new1 !== this.passData.new2) {
      this.showMsg("Hasła nie są identyczne!", 'error');
      return;
    }
    this.api.changePassword({
      userId: this.currentUserId,
      oldPass: this.passData.old,
      newPass: this.passData.new1
    }).subscribe({
      next: () => {
        this.showMsg("Hasło zostało pomyślnie zmienione!", 'success');
        this.passData = { old: '', new1: '', new2: '' };
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.showMsg(err.error?.message || "Błąd zmiany hasła!", 'error');
        this.cdr.detectChanges();
      }
    });
  }

  private showMsg(msg: string, type: 'success' | 'error') {
    this.passMsg = msg;
    this.passMsgType = type;
    setTimeout(() => { this.passMsg = ''; this.cdr.detectChanges(); }, 5000);
  }

  getStatusClass(status: string) {
    if (!status) return 'status-default';
    const s = status.toUpperCase();
    if (s.includes('ANULOWANE')) return 'status-anulowane';
    if (s.includes('REALIZACJI')) return 'status-realizacja';
    if (s.includes('DO ODBIORU')) return 'status-odbior';
    if (s.includes('ZREALIZOWANE')) return 'status-zrealizowane';
    return 'status-default';
  }

  updateUserRole(user: any) {
    this.api.updateUserRole(user.id, user.newRole).subscribe(() => {
      this.loadAdminData();
    });
  }

  deleteUser(id: number) {
    if (confirm('Czy na pewno chcesz usunąć tego użytkownika?')) {
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
      this.newBook = { title: '', author: '', price: 0, stock: 0 };
      this.selectedFile = null;
      this.loadAdminData();
    });
  }

  updateBook(book: any) {
    this.api.updateBook(book.id, { price: book.price, stock: book.stock }).subscribe(() => {
      this.loadAdminData();
    });
  }

  deleteBook(id: number) {
    if (confirm('Usunąć tę książkę z bazy?')) {
      this.api.deleteBook(id).subscribe(() => this.loadAdminData());
    }
  }

  updateOrderStatus(orderId: number, status: string) {
    this.api.updateOrderStatus(orderId, status).subscribe(() => {
      this.loadAdminData();
    });
  }

  deleteOrder(id: number) {
    if (confirm('Trwale usunąć zamówienie?')) {
      this.api.deleteOrder(id).subscribe(() => this.loadAdminData());
    }
  }
}