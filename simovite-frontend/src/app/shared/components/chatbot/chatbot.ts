import {
  Component, OnInit, OnDestroy,
  ViewChild, ElementRef, AfterViewChecked,
  ChangeDetectorRef
} from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { ChatService, ChatMessage, ChatRequest, ChatResponse } from '@shared/services/chatbot.service';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector:    'app-chatbot',
  standalone:  false,
  templateUrl: './chatbot.html',
  styleUrls:   ['./chatbot.scss']
})
export class ChatbotComponent implements OnInit, AfterViewChecked {

  @ViewChild('messagesEnd') private messagesEnd!: ElementRef;
  @ViewChild('inputRef')    private inputRef!: ElementRef;

  // ── State ────────────────────────────────────────────
  isOpen     = false;
  isTyping   = false;
  inputText  = '';
  messages:  ChatMessage[] = [];
  sessionId  = uuidv4();
  unreadCount = 0;

  // ── Suggestions (quick replies) ──────────────────────
  suggestions = [
    '🏪 Quels restaurants sont disponibles ?',
    '🛵 Comment suivre ma livraison ?',
    '💰 Quels sont les frais de livraison ?',
    '⏱️ Quel est le délai moyen ?',
  ];
  showSuggestions = true;

  constructor(
    private chatSvc: ChatService,
    public  auth:    AuthService,
    private cdr:     ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Message de bienvenue
    this.pushBotMessage(
      `Bonjour ${this.auth.fullName.split(' ')[0] || ''} 👋 Je suis **SimoBot**, ton assistant SimoVite.\nComment puis-je t'aider aujourd'hui ?`
    );
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  // ── Open / Close ──────────────────────────────────────

  toggle(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.unreadCount = 0;
      setTimeout(() => this.inputRef?.nativeElement.focus(), 150);
    }
  }

  close(): void { this.isOpen = false; }

  // ── Sending ───────────────────────────────────────────

  send(text?: string): void {
    const content = (text ?? this.inputText).trim();
    if (!content || this.isTyping) return;

    // Push user message
    this.messages.push({
      id:        uuidv4(),
      role:      'user',
      content,
      timestamp: new Date(),
    });

    this.inputText       = '';
    this.showSuggestions = false;
    this.isTyping        = true;

    // Push placeholder "typing" bot message
    const loadingId = uuidv4();
    this.messages.push({
      id:        loadingId,
      role:      'bot',
      content:   '',
      timestamp: new Date(),
      loading:   true,
    });

    this.chatSvc.send({ message: content, sessionId: this.sessionId }).subscribe({
      next: res => {
        // Replace loading placeholder with real reply
        const idx = this.messages.findIndex(m => m.id === loadingId);
        if (idx > -1) {
          this.messages[idx] = {
            id:        loadingId,
            role:      'bot',
            content:   res.reply,
            timestamp: new Date(),
            loading:   false,
          };
        }
        this.isTyping = false;
        if (!this.isOpen) this.unreadCount++;
        this.cdr.detectChanges();
      },
      error: () => {
        const idx = this.messages.findIndex(m => m.id === loadingId);
        if (idx > -1) {
          this.messages[idx] = {
            id:        loadingId,
            role:      'bot',
            content:   'Désolé, une erreur est survenue. Réessaie dans un instant. 🙏',
            timestamp: new Date(),
            loading:   false,
          };
        }
        this.isTyping = false;
        this.cdr.detectChanges();
      }
    });
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  clearHistory(): void {
    this.messages      = [];
    this.sessionId     = uuidv4();
    this.showSuggestions = true;
    this.ngOnInit();
  }

  // ── Helpers ───────────────────────────────────────────

  private pushBotMessage(content: string): void {
    this.messages.push({ id: uuidv4(), role: 'bot', content, timestamp: new Date() });
  }

  private scrollToBottom(): void {
    try { this.messagesEnd?.nativeElement.scrollIntoView({ behavior: 'smooth' }); }
    catch {}
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' });
  }

  // Bold markdown minimal (**text**)
  formatContent(text: string): string {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  }
}