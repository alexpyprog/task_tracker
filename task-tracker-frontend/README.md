src/
├── components/
│   ├── layout/
│   │   ├── Layout.tsx          # Общий layout с боковым меню и навбаром
│   │   ├── Sidebar.tsx         # Боковое меню (с раскрывающимся списком групп)
│   │   ├── Sidebar.module.css
│   │   ├── Navbar.tsx          # Навбар (TTrack + иконка профиля)
│   │   └── Navbar.module.css
│   │
│   ├── common/                 # (оставляем как есть)
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorAlert.tsx
│   │   ├── PasswordConfirmModal.tsx
│   │   └── UserSearch.tsx
│   │
│   ├── dashboard/
│   │   ├── Dashboard.tsx       # Дашборд (статистика, сводка)
│   │   └── Dashboard.module.css
│   │
│   ├── groups/
│   │   ├── GroupsPage.tsx      # Страница всех групп
│   │   ├── GroupDetail.tsx     # Страница конкретной группы
│   │   ├── GroupCreateModal.tsx # Модалка создания группы
│   │   ├── GroupCard.tsx       # Карточка группы для списка
│   │   ├── InvitationsList.tsx # Список приглашений
│   │   └── groups.module.css
│   │
│   ├── tasks/                  # (существующие, но добавить фильтр по группе)
│   │   ├── TaskList.tsx        # ДОБАВИТЬ: фильтр по group_id
│   │   ├── TaskDetail.tsx
│   │   └── TaskCreate.tsx      # ДОБАВИТЬ: выбор группы
│   │
│   ├── settings/
│   │   ├── SettingsPage.tsx    # Настройки (профиль, тема, удаление)
│   │   └── Settings.module.css
│   │
│   └── auth/                   # (оставляем как есть)
│
├── api/
│   ├── groups.ts               # НОВЫЙ: API для групп
│   ├── invitations.ts          # НОВЫЙ: API для приглашений
│   ├── tasks.ts                # ДОБАВИТЬ: group_id параметры
│   └── (остальные файлы)
│
├── contexts/
│   ├── AuthContext.tsx
│   └── GroupsContext.tsx       # НОВЫЙ: контекст для групп
│
├── types/
│   ├── group.ts                # НОВЫЙ: типы для групп
│   ├── invitation.ts           # НОВЫЙ: типы для приглашений
│   └── (остальные)
│
└── App.tsx