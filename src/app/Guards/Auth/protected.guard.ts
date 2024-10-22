import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const protectedGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('Token');
  if (token) {
    router.navigate(['/chat']);
    return false;
  } else {
    return true;
  }
};
