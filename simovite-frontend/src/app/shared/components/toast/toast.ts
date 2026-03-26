import { Component, OnInit } from '@angular/core';
import { ToastService, ToastMessage } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: false,
  templateUrl: './toast.html',
  styleUrl: './toast.scss'
})
export class ToastComponent implements OnInit {
  message: ToastMessage | null = null;

  constructor(private toastService: ToastService) {}

  ngOnInit() {
    // 📻 On écoute les messages qui arrivent du service
    this.toastService.toastState.subscribe((msg) => {
      this.message = msg;
      // On cache le message automatiquement après 3 secondes
      setTimeout(() => this.message = null, 3000);
    });
  }
}