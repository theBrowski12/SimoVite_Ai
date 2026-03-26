import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-root', // 👈 Doit être identique à la balise dans index.html
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.scss'
})
export class App { // 👈 Le nom de la classe est "App"
  protected readonly title = signal('simovite-frontend');
}