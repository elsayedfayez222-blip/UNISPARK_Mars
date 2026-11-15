export type Language = 'ar' | 'en';

export function text(language: Language, arabic: string, english: string): string {
  return language === 'ar' ? arabic : english;
}
