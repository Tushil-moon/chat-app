import {
  Component,
  ElementRef,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../../../Services/Auth/auth.service';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  Storage,
  uploadString,
  getDownloadURL,
  ref,
} from '@angular/fire/storage';
import { updateProfile } from '@angular/fire/auth';
import { filter, from, switchMap, tap } from 'rxjs';
import {
  ImageCropperComponent,
  ImageCroppedEvent,
  LoadedImage,
} from 'ngx-image-cropper';
import { NotifyService } from '../../../../Services/Notify/notify.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    RouterLink,
    ImageCropperComponent,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private st = inject(Storage);
  private notify = inject(NotifyService);

  /**
   * Takke element reference from html
   */
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  /**
   * Show cropper
   */
  showCropper = signal<boolean>(false);

  /**
   * this signal hold the profile image file
   */
  profileImage = signal<string>('../../../../../assets/images/user.png');

  /**
   * Hold cropped image
   */
  croppedImage = signal<Blob | null>(null);

  /**
   * This signal hold boolean value for preventation form submit on invalid form
   */
  submitted = signal<boolean>(false);

  /**
   * Hold changed image event
   */
  imageChangedEvent = signal<Event | null>(null);

  /**
   * Login Form initialization using reactive form
   */
  loginForm: FormGroup = this.fb.group({
    email: this.fb.control('', Validators.required),
    password: this.fb.control('', Validators.required),
    username: this.fb.control('', Validators.required),
  });

  /**
   * Method use for open input element and take image
   */
  editImage(): void {
    this.fileInput.nativeElement.click();
  }

  /**
   * This method use to display preview of profile pic on html
   *
   * @param event - Event of input change
   */
  previewImage(event: Event): void {
    this.showCropper.set(true);
    this.imageChangedEvent.set(event);
  }

  /**
   * handle croped image
   *
   * @param event Image crop event
   */
  imageCropped(event: ImageCroppedEvent): void {
    // console.log(event);
    const eventurl = event.blob;
    if (eventurl) {
      this.croppedImage.set(eventurl);
    } else {
      // console.log(eventurl);
    }
  }

  /**
   * handle load image
   *
   * @param image loaded image
   */
  imageLoaded(image: LoadedImage): void {
    this.notify.success('Image loaded successFully!');
  }

  /**
   * Handle image load error
   */
  loadImageFailed(): void {
    this.notify.error('image fail to load');
  }

  /**
   * Finalize crop
   */
  finalizeCropping(): void {
    const image = this.croppedImage();
    if (image) {
      const reader = new FileReader();
      reader.onload = () => {
        this.profileImage.set(reader.result as string);
        // console.log(reader.result as string);
      };
      reader.readAsDataURL(image);
    }
    this.notify.info('cropping done!');
    this.showCropper.set(false);
    this.croppedImage.set(null);
  }

  /**
   * Handle User registration
   */
  onRegister(): void {
    if (this.loginForm.valid) {
      // console.log(this.loginForm.value);
      const { email, password, username } = this.loginForm.value;
      this.authService
        .register(email, password)
        .pipe(
          switchMap((userCredential) => {
            const user = userCredential.user;
            const imageRef = ref(this.st, `users/${user.uid}/profile.jpg`);
            return from(
              uploadString(imageRef, this.profileImage(), 'data_url')
            ).pipe(
              switchMap(() => getDownloadURL(imageRef)),
              switchMap((downloadURL) =>
                updateProfile(user, {
                  displayName: username,
                  photoURL: downloadURL,
                })
              ),
              switchMap(() => this.authService.saveProfileInDb(user))
            );
          })
        )
        .subscribe({
          next: () => {
            this.notify.success('Registration successfull!');
            this.router.navigate(['/login']);
          },
          error: () => {
            this.notify.error(
              'Error during registration, please try again later'
            );
          },
        });
    }else{
      this.submitted.set(true);
      this.loginForm.markAllAsTouched();
      this.notify.warning('Fill all required field')
    }
  }
}
