import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './services/api'; // Zaimportuj ApiService

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  email = '';
  password = '';
  errorMessage = '';

  constructor(
    private http: HttpClient, 
    private router: Router,
    private api: ApiService // Wstrzyknij ApiService
  ) {}

  onLogin(event: Event) {
    event.preventDefault();

    const loginData = {
      email: this.email,
      password: this.password
    };

    this.http.post<any>('http://192.168.254.105:3000/ksiegarnia-api/login', loginData).subscribe({
      next: (res) => {
        const userToSave = {
          id: res.user.id,
          email: res.user.email,
          role: res.user.role
        };
        
        localStorage.setItem('user', JSON.stringify(userToSave));
        
        // POWIADOM API O ZMIANIE STATUSU
        this.api.updateUserStatus(); 
        
        console.log("Zalogowano pomyślnie:", userToSave);
        this.router.navigate(['/panel']); 
      },
      error: (err) => {
        this.errorMessage = err.error.message || 'Błąd logowania';
      }
    });
  }
}