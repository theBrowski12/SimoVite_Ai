import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export const formatDate = (d: string): string =>
  format(new Date(d), 'dd MMM yyyy', { locale: fr });

export const timeAgo = (d: string): string =>
  formatDistanceToNow(new Date(d), { addSuffix: true, locale: fr });

export const formatTime = (d: string): string =>
  format(new Date(d), 'HH:mm');