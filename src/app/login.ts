import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from './services/api'; // Używamy tylko serwisu

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
  isLoading = false;

  constructor(
    private router: Router,
    private api: ApiService // HttpClient już nie jest tu potrzebny
  ) {}

  onLogin(event: Event) {
    event.preventDefault();

    if (!this.email || !this.password) {
      this.errorMessage = 'Wprowadź dane logowania.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const loginData = { email: this.email, password: this.password };

    // WYWOŁANIE METODY Z SERWISU
    this.api.login(loginData).subscribe({
      next: (res) => {
        const userToSave = {
          id: res.user.id,
          email: res.user.email,
          role: res.user.role
        };
        
        localStorage.setItem('user', JSON.stringify(userToSave));
        
        // POWIADOM API O ZMIANIE STATUSU (to już masz w serwisie)
        this.api.updateUserStatus(); 
        
        console.log("Zalogowano pomyślnie:", userToSave);
        this.router.navigate(['/panel']); 
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Błąd logowania';
      }
    });
  }
}