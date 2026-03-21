"use client"

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Languages } from 'lucide-react';

export default function LanguageSwitcher() {
  const t = useTranslations('Common');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function onLanguageChange(newLocale: string) {
    router.replace(pathname, { locale: newLocale });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full border border-slate-200 dark:border-slate-800 bg-background/50 backdrop-blur-sm">
          <Languages className="h-4 w-4" />
          <span className="sr-only">{t('language')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl border-slate-200 dark:border-slate-800">
        <DropdownMenuItem 
          onClick={() => onLanguageChange('zh')}
          className={locale === 'zh' ? 'font-bold text-primary' : ''}
        >
          {t('chinese')}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => onLanguageChange('en')}
          className={locale === 'en' ? 'font-bold text-primary' : ''}
        >
          {t('english')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
