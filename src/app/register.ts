import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  constructor(private http: HttpClient, private router: Router) {}

  onRegister(event: Event) {
    event.preventDefault();
    this.errorMessage = '';

    this.http.post('http://192.168.254.110:3000/ksiegarnia-api/register', this.regData)
      .subscribe({
        next: () => {
          // Po sukcesie przekieruj do logowania z parametrem msg
          this.router.navigate(['/login'], { queryParams: { msg: 'success' } });
        },
        error: (err) => {
          this.errorMessage = err.error.message || 'Błąd rejestracji';
        }
      });
  }
}
