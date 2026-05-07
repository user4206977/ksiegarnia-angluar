import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; // Dodano RouterModule dla routerLink
import { ApiService } from './services/api';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  regData = {
    email: '',
    password: '',
    imie: '',
    nazwisko: ''
  };
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(private api: ApiService, private router: Router) {}

  onRegister(event: Event) {
    event.preventDefault();
    this.errorMessage = '';
    this.isLoading = true;

    this.api.register(this.regData).subscribe({
      next: () => {
        this.isLoading = false;
        // Przekierowanie do logowania z informacją o sukcesie
        this.router.navigate(['/login'], { queryParams: { registered: 'true' } });
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Wystąpił nieoczekiwany błąd rejestracji.';
      }
    });
  }
}