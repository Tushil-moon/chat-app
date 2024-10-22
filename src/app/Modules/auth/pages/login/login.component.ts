import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../../../Services/Auth/auth.service';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { NotifyService } from '../../../../Services/Notify/notify.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private notify = inject(NotifyService);

  /**
   * preventation form submit on invalid form
   */
  submitted = signal<boolean>(false);

  /**
   * toggle for password
   */
  showPassword = signal<boolean>(false);

  /**
   * Login Form initialization using reactive form
   */
  loginForm: FormGroup = this.fb.group({
    email: this.fb.control('', Validators.required),
    password: this.fb.control('', [
      Validators.required,
      Validators.minLength(6),
    ]),
  });

  /**
   * Handle User Login
   */
  onLogin(): void {
    if (this.loginForm.valid) {
      this.authService.login(this.loginForm.value).subscribe({
        next: (res) => {
          // console.log(res);
          if (res) {
            localStorage.setItem('Token', res.refreshToken);
            localStorage.setItem('logedin', res.uid);
            this.router.navigate(['/chat']);
          }
        },
        error: (error) => {
          // console.log(error.code);
          this.notify.error(error.code);
        },
      });
    } else {
      this.notify.warning('Fill all required field');
      this.loginForm.markAllAsTouched();
    }
  }

  /**
   * toggle password visibility
   */
  togglePasswordVisibility() {
    this.showPassword.set(!this.showPassword());
  }
}
