# NCR Code Conventions

## General
- TypeScript strict mode — всегда типизируй
- Все страницы используют `'use client'` (client-side rendering)
- Path aliases: `@/*` → `src/*`

## Components
- Переиспользуй существующие: `Button`, `FormElements` (Input, Select, Textarea), `Navigation`
- НЕ создавай новые компоненты если можно использовать существующие
- Props типизируй через interfaces
- Accessibility: focus states, ARIA labels

## Styling
- Только Tailwind CSS — никакого inline CSS или CSS modules
- Цвета стадий определены в `STAGE_INFO` (types.ts)
- Responsive design — mobile-friendly
- Loading states для всех async операций

## State Management
- **Zustand** для глобального стейта (useAuthStore, useNCRStore)
- **React Context** для auth (AuthProvider → useAuth())
- **useState** для локального стейта компонентов (формы, loading, errors)
- НЕ смешивай подходы — следуй существующим паттернам

## API / Data
- Все запросы к БД через Supabase client (src/lib/supabase.ts)
- API функции в src/lib/api.ts — добавляй новые туда же
- Паттерн: try/catch → error state → user-friendly message
- RLS на уровне БД — не дублируй проверки в коде без необходимости
- Фильтрация через Supabase query builder (.eq(), .in(), .order())

## Auth
- Проверяй isAuthenticated перед рендером защищённых страниц
- Редиректь на /auth/login если не авторизован
- Роль юзера определяет UI: скрывай/показывай кнопки через canUserActOnNCR()

## Testing
- Playwright E2E тесты в tests/
- Тесты идут последовательно (serial mode)
- Test users определены в tests/test-users.ts
- Скриншоты на каждом шаге
- Базовый URL: localhost:3000

## Git
- НЕ коммить .env.local (секреты)
- .beads/ — beads task tracking, можно коммитить
- Осмысленные commit messages на английском
