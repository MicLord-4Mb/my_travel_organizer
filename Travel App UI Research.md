# **Архитектурное исследование и дизайн-система органайзера путешествий: UX/UI паттерны, компонентный стек и генеративные спецификации для Google Stitch**

Разработка интерфейса современного органайзера путешествий требует решения комплексной задачи: структурирования разнородных информационных потоков, включающих хронологические цепочки событий, динамический финансовый учет и многоуровневые списки задач1. Достижение баланса между высокой плотностью данных и визуальной легкостью восприятия обеспечивается соблюдением отраслевых стандартов эргономики, оптимизацией клиентского состояния и выбором технологического стека, исключающего архитектурные конфликты.

## **Исследование UX/UI лучших практик для органайзеров путешествий**

Анализ ведущих цифровых продуктов индустрии туризма и персонального планирования (Wanderlog, TripIt, специализированные системы в Notion) демонстрирует четкое разделение пользовательского взаимодействия на два концептуальных уровня: макропланирование и микропланирование1. Макроуровень охватывает администрирование общего реестра поездок, тогда как микроуровень представляет собой детализированное рабочее пространство конкретного маршрута5.  
Взаимосвязь между этими уровнями строится по принципу последовательного погружения: из общего каталога поездок пользователь переходит в рабочее пространство выбранного путешествия, где параллельно функционируют три взаимосвязанных функциональных контура — суточная программа (вертикальный таймлайн), система финансового контроля (бюджет и транзакции) и модуль подготовки (чек-листы сборов и задач)1.

### **Навигационная структура и макро-интерфейс каталога поездок**

На главном экране ключевой задачей интерфейса выступает моментальная пространственно-временная ориентация пользователя5. Для этого применяется сегментированная категоризация путешествий по трем базовым состояниям: «Предстоящие», «Текущие» и «Завершенные». Карточка поездки проектируется как самодостаточный информационный блок со строгой визуальной иерархией:

* Визуальный якорь: фотоизображение дестинации с фиксированным соотношением сторон (16:9 на десктопе, 3:2 на мобильных устройствах), формирующее эмоциональный контекст.  
* Временной маркер: точные календарные даты с автоматическим вычислением суммарной продолжительности (например, «12–20 октября 2026 • 8 дней»).  
* Комплексные агрегированные метрики: индикаторы финансового статуса (соотношение запланированного бюджета к израсходованному) и индикаторы готовности к отправлению (процент закрытых задач и собранных вещей).  
* Периферийные действия: контекстное меню управления объектом (редактирование метаданных, копирование шаблона поездки, архивирование и необратимое удаление с обязательным шагом двухэтапной валидации действия).

### **Программа по дням и таймлайн-интерфейс (Itinerary Workspace)**

Центральный экран конкретной поездки базируется на паттерне Split-View или адаптивном Master-Detail представлении7. Вертикальная временная шкала признана наиболее эргономичным решением, так как она устраняет горизонтальную перегрузку вьюпорта и обеспечивает естественный вертикальный скролл на мобильных устройствах8.  
Суточная навигация организуется в виде закрепленной горизонтальной ленты переключателей (Sticky Day Rail), отображающей номер дня, дату и суммарный суточный расход4. В десктопной версии лента может трансформироваться в левый вспомогательный сайдбар с механизмом отслеживания положения прокрутки (Scrollspy), позволяя переключаться между днями в один клик.  
События внутри дня ранжируются по жестким временным слотам либо группируются по гибким фазам («Утро», «День», «Вечер»)5. Каждое событие снабжается семантическим цветовым и иконографическим маркером:

* Транспортные узлы (авиаперелеты, поезда, паромы) маркируются акцентным синим цветом (\#3B82F6).  
* Размещение (отели, апартаменты, кемпинги) кодируется фиолетовым оттенком (\#8B5CF6).  
* Экскурсии, музеи и достопримечательности обозначаются изумрудным тоном (\#10B981).  
* Гастрономия (рестораны, кафе, рынки) выделяется теплым янтарным цветом (\#F59E0B).

### **Паттерны перетаскивания и изменения порядка (Drag-and-Drop)**

Изменение очередности пунктов маршрута является наиболее уязвимым сценарием с точки зрения ошибок взаимодействия10. Следование отраслевым стандартам накладывает жесткие требования на поведение интерфейса:

* Наличие явных визуальных манипуляторов (Drag Handles) в виде иконки с шестью точками (Grip Vertical) с курсором cursor: grab (в процессе переноса — cursor: grabbing), что предотвращает непреднамеренный захват при попытке выделить текстовые блоки или активировать внутренние кнопки10.  
* Моментальная визуальная обратная связь в зоне назначения (Drop Indicator): отображение контрастной акцентной линии вставки толщиной 2–3 пикселя либо полупрозрачного контурного заполнителя, сохраняющего геометрические размеры карточки10.  
* Изоляция жестов на мобильных устройствах: для исключения конфликта между вертикальным скроллом страницы и операцией перетаскивания захват активируется либо строго по области манипулятора, либо через удержание пальца (Long Press) с задержкой в 200 миллисекунд.  
* Поддержка доступности (WCAG a11y): полная дублируемость манипуляций с клавиатуры, где нажатие клавиш Space или Enter на манипуляторе активирует режим переноса, клавиши со стрелками смещают объект по вертикали, а повторное нажатие подтверждает позицию с обязательным оповещением вспомогательных технологий через контейнеры aria-live12.

### **Управление бюджетом и расходами**

Финансовый модуль должен отвечать на два ключевых вопроса пользователя: каков текущий остаток средств и в каких категориях сосредоточены основные траты14.  
Верхняя панель модуля отводится под карточки ключевых показателей (KPI): общий утвержденный лимит, фактически зафиксированная сумма расходов и доступный остаток. Текущее финансовое состояние визуализируется линейным прогресс-баром исчерпания средств. Относительное значение расхода рассчитывается по формуле:  
![][image1]  
где ![][image2] представляет отдельные расходные операции, а ![][image3] — совокупный установленный лимит бюджета. Превышение порога в 90% переводит индикатор в предупреждающий статус, а при ![][image4] интерфейс сигнализирует об аварийном перерасходе (Over-budget Alert) с окрашиванием элементов в красный спектр. Ниже располагается таблично-списочный реестр транзакций с возможностью фильтрации по категориям и привязкой к конкретным дням программы14.

### **Чек-листы вещей и задач**

Модуль подготовки оптимизируется под предотвращение забытых вещей и невыполненных обязательств1. Он структурируется в два независимых списка: подготовительные дела (оформление виз, страховок, бронирование билетов) и багаж (электроника, одежда, аптечка, документы)1. Каждый элемент снабжается интерактивным чекбоксом, вычеркивающим текст при завершении задачи, и приоритетным маркером. Общий прогресс агрегируется в радиальный или линейный процентный индикатор готовности.

### **Адаптивные контрольные точки и компоновка интерфейса**

Адаптивность обеспечивается трансформацией компоновки в зависимости от ширины экрана пользователя, как показано в сравнительной таблице.

| Вьюпорт | Брейкпоинт | Компоновка макета | Паттерн навигации | Поведение таймлайна и списков |
| :---- | :---- | :---- | :---- | :---- |
| **Desktop** | **![][image5]** | 3 колонки: постоянный боковой сайдбар, рабочий таймлайн маршрута, контекстная панель бюджета/задач | Левый вертикальный Sidebar с фиксированными ссылками | Развернутые карточки, параллельный просмотр программы и финансового баланса |
| **Tablet** | **![][image6]** | 2 колонки: основной рабочий контент с переключаемой правой панелью через вкладки | Сворачиваемый Sidebar (Icon Rail) с всплывающими подсказками | Сжатые карточки событий, модальные окна средней ширины |
| **Mobile** | **![][image7]** | 1 колонка: последовательный линейный стек элементов | Нижняя панель (Bottom Navigation Bar) с центральной кнопкой быстрого действия (FAB) | Полноэкранный вертикальный таймлайн, вынос диалогов и форм в нижние всплывающие шторки (Bottom Sheets) |

## **Архитектурный анализ UI-библиотеки: дилемма shadcn/ui и CSS Modules**

Выбор базовой компонентной библиотеки определяет долгосрочную масштабируемость и поддерживаемость кодовой базы16. Рассмотрение библиотеки shadcn/ui на проекте с модульным CSS вскрывает фундаментальный парадигмальный конфликт17.

### **Техническое противоречие между shadcn/ui и CSS Modules**

shadcn/ui концептуально спроектирован не как независимый дистрибутив готовых компонентов, а как генератор открытого исходного кода, жестко интегрированный в технологический стек: **Tailwind CSS \+ Radix UI \+ Class Variance Authority (CVA) \+ clsx \+ tailwind-merge**16. Все внутренние связи, адаптивные состояния, темы оформления и псевдоклассы компонентов shadcn/ui декларируются через утилитные классы Tailwind непосредственно в разметке JSX (className="flex items-center space-x-2 rounded-md bg-primary p-4...")19.  
Использование классического shadcn/ui в проекте, где стандартом выбран **CSS Modules**, влечет за собой критические риски:

> 1. *Раздвоение методологии стилизации:* Кодовая база неизбежно раскалывается на две противоборствующие концепции — декларативные инлайн-утилиты Tailwind внутри сгенерированных компонентов shadcn и BEM-подобные локально-скоупленные файлы \*.module.css для бизнес-логики приложения. Это усложняет сопровождение кода и повышает порог входа17.  
> 2. *Поломка экосистемы обновлений:* Официальный интерфейс командной строки (CLI) shadcn создает компоненты исключительно с классами Tailwind. Попытка вручную вычищать Tailwind-классы и переписывать каждый компонент на CSS Modules лишает инструмент его ключевого преимущества — скорости разработки. Сторонние порты (например, shadcn-css) являются любительскими форками с высоким риском прекращения поддержки и отставанием от релизных циклов React18.  
> 3. *Избыточный объем и конфликты сборок:* Проект вынужден подключать полный компилятор Tailwind CSS ради обслуживания 5–6 атомарных примитивов, в то время как основная масса стилей пишется в изолированных модулях17.

### **Сравнительный анализ альтернативных компонентных решений**

Для стека React, TypeScript, Vite с модульным CSS был проведен сравнительный анализ четырех подходов к организации UI-атомов.

| Библиотека / Подход | Совместимость с CSS Modules | Доступность (a11y) из коробки | Гибкость кастомизации | Затраты на интеграцию | Интеграция с Vite & TypeScript |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **shadcn/ui** | Крайне низкая (требует Tailwind либо полного ручного переписывания) | Полное соответствие WAI-ARIA (на базе Radix) | Высокая | Высокие (конфликт двух систем стилей) | Полная17 |
| **Radix UI Primitives (Headless)** | Нативная (100% совместимость, стили отсутствуют) | Эталонная (фокус-ловушки, клавиатурная навигация, роли) | Абсолютная (полный контроль над DOM и классами) | Умеренные (требуется первичное оформление атомов) | Полная, первоклассная типизация TS16 |
| **Mantine UI (v7+)** | Нативная (внутренняя архитектура построена на CSS Modules) | Высокая | Высокая (собственная система токенов и пропсов) | Минимальные (компоненты готовы к использованию) | Полная нативная поддержка Vite24 |
| **Base UI (MUI Headless)** | Нативная (полностью нестилизованные примитивы) | Высокая | Абсолютная | Умеренные | Полная26 |

### **Оценка библиотек для реализации Drag-and-Drop**

Для механизма перетаскивания пунктов маршрута сопоставлены два лидирующих решения:

* Библиотека @hello-pangea/dnd (форк классического react-beautiful-dnd) предоставляет готовую физическую анимацию, однако опирается на тяжеловесную мутацию DOM-структуры и имеет ограничения при адаптации под нестандартные многоколоночные сетки27.  
* Библиотека @dnd-kit/core в связке с @dnd-kit/sortable является современным отраслевым стандартом12. Она построена на хуках (useSortable, useDraggable), полностью свободна от навязанных стилей, безупречно связывается с CSS Modules через аппаратные трансформации transform: CSS.Translate.toString(transform), поддерживает кастомные сенсоры касания и содержит готовые модули клавиатурной доступности12.

### **Итоговое архитектурное решение**

**Решение:** Полный отказ от установки shadcn/ui в пользу связки **Radix UI Primitives \+ нативные CSS Modules**, дополненной библиотекой **@dnd-kit** для интерактивного расписания.  
Данный выбор обоснован следующими факторами:

> 1. *Сохранение фундаментальных преимуществ:* Radix UI Primitives — это та самая основа доступности и надежности, которая заложена внутрь shadcn/ui16. Разработчик получает эталонное поведение выпадающих списков, диалоговых окон, вкладок и тултипов без стороннего Tailwind-рантайма16.  
> 2. *Идеальный симбиоз состояний с CSS Modules:* Компоненты Radix транслируют внутреннее состояние через data-атрибуты (\[data-state="open"\], \[data-state="checked"\], \[data-disabled\]), что позволяет описывать адаптивные переходы и анимации напрямую в селекторах CSS Modules без манипуляций со строками классов23.  
> 3. *Чистота архитектуры:* Вся кодовая база проекта сохраняет единый стандарт стилизации, опирающийся на спецификацию CSS Modules и централизованные токены темы, оформленные в виде нативных CSS-переменных.

## **Архитектура состояния приложения (Redux Toolkit и localStorage)**

Для управления сущностями органайзера путешествий формируется нормализованное клиентское хранилище на базе Redux Toolkit, защищающее интерфейс от каскадных ререндеров при частом обновлении порядка событий31.  
Поток данных организуется по однонаправленной схеме: пользовательские действия вызывают редукторы соответствующих срезов Redux Store (tripsSlice, itinerarySlice, budgetSlice, checklistSlice), после чего специализированный промежуточный слой (Middleware) с дебаунсом асинхронно синхронизирует слепок данных с браузерным хранилищем localStorage31.

### **Декомпозиция срезов (Feature Slices)**

* tripsSlice: хранит нормализованный реестр поездок с использованием createEntityAdapter, гарантируя константную скорость доступа ![][image8] по идентификатору поездки31.  
* itinerarySlice: управляет суточными контейнерами и упорядоченными массивами идентификаторов пунктов маршрута (itemIds: string\[\]). Подобная нормализация позволяет библиотеке @dnd-kit изменять очередность событий через сдвиг индексов (arrayMove) без необходимости мутировать вложенные структуры объектов12.  
* budgetSlice: отслеживает лимиты затрат, валютные настройки и транзакции с агрегирующими мемоизированными селекторами расходов по категориям.  
* checklistSlice: хранит списки предполетных задач и инвентаря с флагами готовности и категоризацией.  
* uiSlice: изолирует временное состояние интерфейса — активный день в программе, поисковый запрос, параметры сортировки и состояние модальных окон.

### **Синхронизация с localStorage**

Вместо избыточной сериализации хранилища при каждом единичном действии внедряется специализированный Redux Middleware:

* Синхронизация откладывается с помощью дебаунса с тайм-аутом в 300 миллисекунд, агрегируя частые пользовательские операции (например, ввод текста или перетаскивание карточек).  
* Этап начальной гидратации состояния (Initial State Hydration) сопровождается проверкой схемы данных библиотекой Zod, что предотвращает фатальные сбои приложения при повреждении сохраненных структур в браузере.  
* Внедряется защитный перехват исключения переполнения квоты памяти браузера (QuotaExceededError) с корректным выводом уведомления пользователю.

## **Комплексный промпт для Google Stitch**

Инструмент генеративного прототипирования Google Stitch демонстрирует наивысшую точность при использовании методологии Zoom-Out-Zoom-In: первичное задание жестких контекстных рамок и дизайн-токенов в формате DESIGN.md с последующим пакетным описанием взаимосвязанных экранов14.  
Ниже приведена полная спецификация, подготовленная для генерации комплексного адаптивного интерфейса.

### **Базовая дизайн-система (DESIGN.md)**

Следующая спецификация задает дизайн-токены и визуальные ограничения34:

# **DESIGN SYSTEM SPECIFICATION (DESIGN.md)**

## **Brand Identity & Atmosphere**

* Application: Travel Organizer & Workspace (Modern Web App)  
* Aesthetic: Scandinavian functional minimalism. High glanceability, tactical information density, calm neutral surfaces with high-contrast functional accents.  
* Surface & Geometry: Pure white interactive surfaces over warm neutral backgrounds (\#F8F9FA). Border radius scale: Base 8px, Cards 12px, Modals/Sheets 16px, Badges 9999px.

## **Color Palette Tokens**

* Background Canvas: \#F8F9FA  
* Surface Base: \#FFFFFF  
* Text Primary: \#1E293B (Deep slate)  
* Text Secondary: \#64748B (Muted slate)  
* Border Subtle: \#E2E8F0  
* Primary Brand Accent: \#0D9488 (Teal \- active buttons, focus outlines, primary states)  
* Primary Accent Hover: \#0F766E  
* Category Transport: \#3B82F6 (Vibrant Blue)  
* Category Lodging: \#8B5CF6 (Purple)  
* Category Activities: \#10B981 (Emerald Green)  
* Category Dining: \#F59E0B (Warm Amber)  
* Status Danger / Over-budget: \#EF4444 (Crimson Red)  
* Status Success: \#10B981

## **Typography System**

* Font Family: Inter, system-ui, \-apple-system, sans-serif  
* Display Title: 24px, Semi-Bold, tracking \-0.02em  
* Section Header: 18px, Semi-Bold, tracking \-0.01em  
* Body Regular: 14px, Regular, line-height 1.5  
* Body Medium: 14px, Medium  
* Caption / Micro: 12px, Regular, color: \#64748B  
* Numeric / Currency: 13px, Medium, Tabular Numerals (monospace alignment)

### **Пакетный промпт генерации экранов для Google Stitch**

Текст ниже предназначен для непосредственного ввода в диалоговое окно Google Stitch (рекомендуется режим Web, модель Gemini 2.5 Pro / 3 Pro)14:  
Act as a Principal Product Designer specializing in productivity web applications. Generate a complete, responsive 4-screen layout for a Travel Organizer web app conforming strictly to the tokens and principles defined in DESIGN.md.  
Produce the following interconnected views:  
\========================================= SCREEN 1: TRIPS CATALOG & DASHBOARD Platform: Desktop (1440px) with responsive single-column mobile view Objective: Search, filter, view, and create travel projects. Layout Structure:

> 1. Top Navigation Bar: Minimalist logo ("WanderFlow"), search bar ("Search trips, places..."), theme switch icon, and primary action button "+ Plan New Trip" (\#0D9488).  
> 2. Filter & Sort Toolbar: Horizontal filter pills ("All", "Upcoming", "Active", "Past"), sort selector ("By Date", "By Budget", "Alphabetical"), and view toggle (Grid / Compact list).  
> 3. Trip Cards Grid (3 columns desktop, 1 column mobile):  
   * Card structure: 16:9 photo thumbnail with destination badge (e.g. "Tokyo, Japan") and duration tag ("Oct 12-20, 2026 • 8 Days").  
   * Card content: Bold trip title, packing checklist progress indicator ("8/12 items packed"), compact budget bar ("\$1,450 / \$2,000 spent").  
   * Actions: Quick-access three-dots context menu (Edit, Duplicate, Delete).  
> 4. Empty State Variant: Minimalist placeholder illustration with the caption "No journeys planned yet" and a centered CTA button "+ Create your first trip".

\========================================= SCREEN 2: ITINERARY WORKSPACE (DAY-BY-DAY TIMELINE) Platform: Split-View Desktop (1440px) / Stacked Mobile (390px) Objective: View hourly schedule, manage stops, and reorder events with explicit drag-and-drop affordance. Layout Structure:

> 1. Workspace Header: Navigation back link, editable trip name ("Tokyo Exploration"), date range subtitle, budget badge, and utility action buttons (Share, Checklist Drawer).  
> 2. Sticky Day Ribbon: Horizontal calendar bar featuring Day cards ("Day 1 • Oct 12", "Day 2 • Oct 13", etc.) with active day highlighted in teal border and total daily cost preview.  
> 3. Timeline Canvas:  
   * Left vertical chronological axis with circular timestamp nodes.  
   * Draggable Event Cards:  
     * Anatomy: Visible six-dot drag handle on the left edge (cursor-grab indicator).  
     * Category indicator: Left vertical color strip (Blue for transport, Purple for stay, Emerald for activities, Amber for food).  
     * Data fields: Time tag ("09:30 AM"), activity name ("Meiji Shrine"), address with location pin, estimated cost badge, and notes link.  
   * Dragging State: Display one active lifted card with elevation shadow, subtle 2-degree tilt, and a prominent horizontal teal insertion indicator (\#0D9488) marking the drop destination between adjacent cards.  
   * Inline Action: Dashed border container "+ Add activity to Day 2" at the bottom of the timeline list.

\========================================= SCREEN 3: BUDGET & EXPENSES TRACKER Platform: Responsive Analytics Dashboard Grid Objective: Track expenses, compare against limits, and log new transactions. Layout Structure:

> 1. KPI Overview (3 cards):  
   * "Total Budget" (\$2,500.00).  
   * "Spent to Date" (\$1,820.50) with an emerald progress bar (72.8% of total).  
   * "Remaining Balance" (\$679.50). Include an alternative visual variant of an Over-budget Alert state if limits are exceeded.  
> 2. Category Breakdown: Compact horizontal progress meters for Flights (45%), Lodging (30%), Food (15%), Sightseeing (10%).  
> 3. Transaction Ledger:  
   * Search filter bar with category dropdown selector.  
   * Clean data table with date, transaction name, color-coded category badge, payment status, and bold tabular monospace currency values.  
> 4. "Add Expense" Modal Dialog:  
   * Centered modal with fields: Description, Amount with currency selector, Category picker, Associated Day, and receipt note. Visible validation states for required inputs and teal primary submit button.

\========================================= SCREEN 4: CHECKLISTS & PACKING MANAGEMENT Platform: Responsive 2-Column Desktop / Segmented Mobile View Objective: Manage pre-departure preparation and baggage tracking. Layout Structure:

> 1. Summary Header: Progress meter ("68% Packed & Ready") with full-width completion bar and "Mark all completed" action.  
> 2. Dual Column Layout:  
   * Column 1: "Pre-Trip Tasks" (Documents, Insurance, Bookings).  
   * Column 2: "Luggage & Packing" grouped by sub-headers (Electronics, Clothing, Toiletries, Medicine).  
> 3. Checklist Items:  
   * Accessible custom checkbox element.  
   * Item title; when completed: subtle strike-through with muted slate text color (\#94A3B8).  
   * Urgency tag ("High Priority" in soft crimson, "Optional" in soft slate).  
> 4. Quick Entry Bar: Fixed bottom input line "+ Add task or baggage item (Press Enter)" for rapid-fire logging.

\========================================= SYSTEM BEHAVIORS & ADAPTIVE SPECS:

* Mobile Layout (\<768px): All top navigational structures collapse into a fixed Bottom Navigation Bar featuring 4 primary tabs (Trips, Itinerary, Budget, Tasks) and a centered Floating Action Button (+ FAB).  
* Desktop Modals convert into draggable Bottom Sheets on mobile viewports.  
* Visual hierarchy must prioritize clarity, spacing based on an 8px grid system, and high glanceability without unnecessary decorative clutter.

## **Инженерные рекомендации по реализации фронтенда**

После генерации и согласования макетов в Google Stitch разработка клиентской части организуется в соответствии со стандартами модульной архитектуры.

### **Структура проекта и файловая организация**

Проект структурируется по модульному принципу Feature-Sliced Design (FSD) или Feature-First архитектуре:

* Корневая директория приложения содержит конфигурацию глобального хранилища Redux Toolkit (app/store.ts) и корневые редукторы.  
* Слой функциональных модулей (features/) разделяется на независимые домены:  
  * Модуль поездок (features/trips): компоненты карточек каталога, селекторы и адаптеры сущностей.  
  * Модуль программы (features/itinerary): компоненты вертикального таймлайна, интеграция хуков @dnd-kit и логика перестановки событий.  
  * Финансовый модуль (features/budget): учет расходов, расчет процентного исчерпания лимитов и модальные формы ввода транзакций.  
  * Модуль чеклистов (features/checklist): списки багажа и предполетных задач с фильтрацией по статусу.  
* Слой повторно используемых ресурсов (shared/) аккумулирует:  
  * Директорию UI-атомов (shared/ui/), где каждый компонент изолирован в собственной папке вместе со стилями (например, Button/Button.tsx и Button/Button.module.css, Dialog/Dialog.tsx и Dialog/Dialog.module.css).  
  * Библиотеку валидационных схем Zod и утилит работы с localStorage (shared/lib/).

### **Порядок реализации ключевых узлов**

> 1. *Интеграция UI-атомов на Radix UI:* Каждый компонент ввода, диалоговое окно (@radix-ui/react-dialog), выпадающее меню (@radix-ui/react-dropdown-menu) и вкладки (@radix-ui/react-tabs) оборачиваются в тонкие React-компоненты. Оформление состояний привязывается к атрибутам data-state непосредственно внутри соответствующих файлов \*.module.css23.  
> 2. *Реализация Drag-and-Drop в расписании:* Программа дня оборачивается в компонент \<SortableContext items={dayItemIds} strategy={verticalListSortingStrategy}\>. Карточка события использует хук useSortable({ id }), передавая свойства слушателей событий (listeners) строго на манипулятор (Grip Icon), а стили аппаратного смещения накладываются через инлайн-свойство transform: CSS.Translate.toString(transform) с фиксацией will-change: transform12.  
> 3. *Декларативная валидация форм:* Реализуется через интеграцию библиотеки React Hook Form со схемами Zod. Валидируются диапазоны дат (дата окончания не может предшествовать дате начала), неотрицательные числовые значения бюджета и расходов, а также строковые ограничения названий локаций39.  
> 4. *Отказоустойчивая персистентность:* Синхронизация с localStorage изолируется в промежуточном слое с предварительной проверкой квоты хранилища и валидацией восстанавливаемых данных, исключая повреждение состояния при некорректных записях в браузере.

#### **Источники**

> 1. Designing an app that helps in planning a trip. A UI/UX case study., [https\://medium.com/@rakidaw/designing-an-app-that-helps-in-planning-a-trip-a-ui-ux-case-study-7b1b411d4b3f](https://medium.com/@rakidaw/designing-an-app-that-helps-in-planning-a-trip-a-ui-ux-case-study-7b1b411d4b3f)  
> 2. Trip itinerary app development: How to create a travel ... \- Overcode, [https\://www\.overcode.tech/blog/travel-itinerary-app](https://www.overcode.tech/blog/travel-itinerary-app)  
> 3. Best 10 Travel Planner Templates for Travel Planners \- Notion, [https\://www\.notion.com/templates/collections/best-10-travel-planner-templates-for-travel-planners](https://www.notion.com/templates/collections/best-10-travel-planner-templates-for-travel-planners)  
> 4. Wanderlog travel planner: free vacation planner and itinerary app, [https\://wanderlog.com/](https://wanderlog.com/)  
> 5. Use Wanderlog for your next trip. Hands down the BEST planning, [https\://www\.reddit.com/r/travel/comments/pd6j4g/psa\_use\_wanderlog\_for\_your\_next\_trip\_hands\_down/](https://www.reddit.com/r/travel/comments/pd6j4g/psa_use_wanderlog_for_your_next_trip_hands_down/)  
> 6. Build a Travel App Like Wanderlog: Cost & Features \- JPLoft, [https\://www\.jploft.com/blog/how-to-build-a-travel-planning-app-like-wanderlog](https://www.jploft.com/blog/how-to-build-a-travel-planning-app-like-wanderlog)  
> 7. I Tested Wanderlog Pro for a Group Trip: Here is My Honest Review, [https\://stardrift.ai/resources/wanderlog](https://stardrift.ai/resources/wanderlog)  
> 8. Top React Libraries for Project Management Apps You Need to, [https\://dev.to/olga\_tash/top-react-libraries-for-project-management-apps-you-need-to-know-5dg8](https://dev.to/olga_tash/top-react-libraries-for-project-management-apps-you-need-to-know-5dg8)  
> 9. 9 React Libraries for Project Management Apps | Medium, [https\://medium.com/@olgatashlikovich/9-react-libraries-for-project-management-apps-f7657e9e816c](https://medium.com/@olgatashlikovich/9-react-libraries-for-project-management-apps-f7657e9e816c)  
> 10. Drag & Drop UX Design Best Practices \- Pencil & Paper, [https\://www\.pencilandpaper.io/articles/ux-pattern-drag-and-drop](https://www.pencilandpaper.io/articles/ux-pattern-drag-and-drop)  
> 11. Drag-and-Drop UX: Guidelines and Best Practices, [https\://smart-interface-design-patterns.com/articles/drag-and-drop-ux/](https://smart-interface-design-patterns.com/articles/drag-and-drop-ux/)  
> 12. Sortable — Free Nextjs Template \- shadcn.io, [https\://www\.shadcn.io/template/sadmann7-sortable](https://www.shadcn.io/template/sadmann7-sortable)  
> 13. Designing drag and drop UIs: Best practices and patterns, [https\://blog.logrocket.com/ux-design/drag-and-drop-ui-examples/](https://blog.logrocket.com/ux-design/drag-and-drop-ui-examples/)  
> 14. Google Stitch for UI Design \- UX Planet, [https\://uxplanet.org/google-stitch-for-ui-design-544cf8b42d52](https://uxplanet.org/google-stitch-for-ui-design-544cf8b42d52)  
> 15. Set a budget \- Wanderlog Help Center, [https\://help.wanderlog.com/hc/en-us/articles/5154885282587-Set-a-budget](https://help.wanderlog.com/hc/en-us/articles/5154885282587-Set-a-budget)  
> 16. Base UI Vs Radix UI: Comprehensive Guide For Beginners, [https\://shadcnstudio.com/blog/base-ui-vs-radix-ui/](https://shadcnstudio.com/blog/base-ui-vs-radix-ui/)  
> 17. Кажется, я облажался, используя shadcn ui : r/react \- Reddit, [https\://www\.reddit.com/r/react/comments/1ffjs7j/i\_think\_i\_screwed\_up\_by\_using\_shadcn\_ui/?tl=ru](https://www.reddit.com/r/react/comments/1ffjs7j/i_think_i_screwed_up_by_using_shadcn_ui/?tl=ru)  
> 18. CSS Modules port of shadcn/ui \- Reddit, [https\://www\.reddit.com/r/css/comments/1ntu9ic/css\_modules\_port\_of\_shadcnui/](https://www.reddit.com/r/css/comments/1ntu9ic/css_modules_port_of_shadcnui/)  
> 19. Best practices for customizing shadcn-ui components with Tailwind, [https\://github.com/shadcn-ui/ui/discussions/9754](https://github.com/shadcn-ui/ui/discussions/9754)  
> 20. These Radix-based UI Libraries are Crazy Awesome \- Medium, [https\://shaxadd.medium.com/these-radix-based-ui-libraries-are-crazy-awesome-3ab656a21a22](https://shaxadd.medium.com/these-radix-based-ui-libraries-are-crazy-awesome-3ab656a21a22)  
> 21. BadreddineIbril/shadcn-css \- GitHub, [https\://github.com/BadreddineIbril/shadcn-css](https://github.com/BadreddineIbril/shadcn-css)  
> 22. radix-ui · GitHub Topics, [https\://github.com/topics/radix-ui](https://github.com/topics/radix-ui)  
> 23. Styling – Radix Primitives, [https\://www\.radix-ui.com/primitives/docs/guides/styling](https://www.radix-ui.com/primitives/docs/guides/styling)  
> 24. Version v8.3.0 \- Mantine, [https\://mantine.dev/changelog/8-3-0/](https://mantine.dev/changelog/8-3-0/)  
> 25. Mantine, [https\://mantine.dev/](https://mantine.dev/)  
> 26. Radix UI vs Base UI \- Detailed Guide \- Shadcn Space, [https\://shadcnspace.com/blog/radix-ui-vs-base-ui](https://shadcnspace.com/blog/radix-ui-vs-base-ui)  
> 27. Top 5 Drag-and-Drop Libraries for React in 2026 \- Puck, [https\://puckeditor.com/blog/top-5-drag-and-drop-libraries-for-react](https://puckeditor.com/blog/top-5-drag-and-drop-libraries-for-react)  
> 28. Best React library for drag and drop? : r/nextjs \- Reddit, [https\://www\.reddit.com/r/nextjs/comments/1b35dsz/best\_react\_library\_for\_drag\_and\_drop/](https://www.reddit.com/r/nextjs/comments/1b35dsz/best_react_library_for_drag_and_drop/)  
> 29. Changelog \- Docs \- FireCMS, [https\://firecms.co/docs/changelog/](https://firecms.co/docs/changelog/)  
> 30. Styling Radix UI with CSS \- Samuel Kraft, [https\://samuelkraft.com/blog/radix-ui-styling-with-css](https://samuelkraft.com/blog/radix-ui-styling-with-css)  
> 31. Redux Style Guide, [https\://redux.js.org/style-guide/](https://redux.js.org/style-guide/)  
> 32. Redux Toolkit Best Practices in 2026 | by Leandro A. Siqueira, [https\://javascript.plainenglish.io/redux-toolkit-best-practices-in-2026-c7d10cdc8de9](https://javascript.plainenglish.io/redux-toolkit-best-practices-in-2026-c7d10cdc8de9)  
> 33. Redux Essentials, Part 2: Redux Toolkit App Structure, [https\://redux.js.org/tutorials/essentials/part-2-app-structure](https://redux.js.org/tutorials/essentials/part-2-app-structure)  
> 34. Google Stitch: AI-Native UI Design That Actually Understands Your, [https\://dev.to/stevengonsalvez/google-stitch-ai-native-ui-design-that-actually-understands-your-design-system-58f2](https://dev.to/stevengonsalvez/google-stitch-ai-native-ui-design-that-actually-understands-your-design-system-58f2)  
> 35. I Designed a Multi-Screen App in Google Stitch: Here's My Entire, [https\://medium.com/@cengizdonmez/i-designed-a-multi-screen-app-in-google-stitch-heres-my-entire-process-7e73c20aaf83](https://medium.com/@cengizdonmez/i-designed-a-multi-screen-app-in-google-stitch-heres-my-entire-process-7e73c20aaf83)  
> 36. design.md vs LESS Tokens — Documentation vs Infrastructure, [https\://designless.io/design-md](https://designless.io/design-md)  
> 37. google-labs-code/design.md: A format specification for describing a, [https\://github.com/google-labs-code/design.md](https://github.com/google-labs-code/design.md)  
> 38. Google Stitch Complete Guide: Vibe Design, Voice Canvas &, [https\://www\.nxcode.io/resources/news/google-stitch-complete-guide-vibe-design-2026](https://www.nxcode.io/resources/news/google-stitch-complete-guide-vibe-design-2026)  
> 39. dnd-kit · GitHub Topics, [https\://github.com/topics/dnd-kit?l=typescript\&o=desc\&s=forks](https://github.com/topics/dnd-kit?l=typescript&o=desc&s=forks)

[image1]: <data:image/png;base64,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>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAaCAYAAABYQRdDAAABSklEQVR4Xu2UzytEURSAj1CEEKXJQpQtYkOxm40dVoq1ws6GJckfICtRkp3sKbO08zcoJAt2ysaP+E733Hn3vZ7xphkLNV99Teec+96ce959T6TGXzONXxlds2syc4zvOJnI1+Eo3uFcolaSTrzGW+yNl4ocYj6ZLMUwvuAZNlhOf0ew0eJdW5eZBXEzWw9y2rF212Kxbr0jKv+OXvyBM5jDPtzHnXBROfh5fuID3uOTxWXNMGQMXyU+zzY8xQGL6y3nGcJ5cScjFT/P8Az24B42Waw3WInKsoxLQRxD/+lI0s+npxVPsD9Z+Ak/zxtx3aWxKK5rbUBPwhYeYHu4KCRtnh69wQY+44TlZsWd3fMgV0Sf6qNE73T45NW3oHaBze4yGcRxvBS3y6qxaVaNbrwS1+2qRDuoiC4s4DZOJWoVoR8Y/z2o8d/4Bo2dQiRVbw37AAAAAElFTkSuQmCC>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAAZCAYAAADXPsWXAAAA/ElEQVR4Xu2SwQoBURSGj9goWUkpRYryABaUB7BgK09g5RlseAFZKcnCI9hYeQIrslJIJMlGShH/deYy9xozS5v56mum+e/t3HvOELk4kYNr+DB5hlvj/Q6HMCU32NGCF5jRvifhAs5hVMsUAnAMZzCkRi/6xKcq6oGZBNzBHvRomSxwhVk1UikRV6rqASgT96UNfVqm0CSuVIARwxiswz2sQO97tQXyuAfi63QMu8Q9asCgXPwLu37EiSczgWE1UrHrh0BORlzVEqfR5ol7NSJea0kaHuGA1KuIJorKJzglbvIXosKKPr+5GOGG+PcXzxtcwhr08xYXlz/xBB76OKePI6vzAAAAAElFTkSuQmCC>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFsAAAAaCAYAAADYMiBQAAAELUlEQVR4Xu2YXchVRRSGV2igZPlTJJGRSRGCWZQWRkVKRV5oURlhXSkSVBAUKYhBoIEVRJRRmRZdRPkTFJlWigl1IXZRdtFFIRn0A0UGURchlu/D2stv9py9z78ofPuFh7PPzN77zLyzZs3MMWvUqNHo1CRxrjgjr0h0pjgrL2zUvTD3cfGBeFa8ZtWGjhcvi8V5RSfNF7+K/xOOiN+K67/FC+KceOAUabq4Ly9MdLm5QRvFUnNDctGHR83veVJcUK62a8S3Yoa58WvFz+JhcbGYJpaIr8QrYqw/1rs2iaPihqz8anPjPxUTsrpU54sd4hnzKTgMzRQPib3imHirXH1Cd5ubdJV5GzFpt5iY3INZB8UKMU4sFN+Ja5N7HhOfi7OL73jxhHk7GOj7xb3ifXPj+xIv50cOialZHY3fJ/4Tt5SrWkQ0XCc+ExvEReXqnkUn7xTXi5+s2mx+43tzI0KTxZfikeI7EUgwbS+uQ0+Lj21kFvD+fTYSVET6S8U1on8EU8/pIxWd+sNaG4Oi4VVRXycaNds80reZT/FBxHT/0arNxuR/zI0J8ftv24hxpAVS5arkHnSXlZ9dbWWz54p1xTW61Tyl5h71JEaK/Mw0yjVP/Cv2W3ladqtLxGaxy3wA2q3wdWpn9ovWajbiXgzGaGYkMzM3e5F5v2NW3Gw+SyJFkMIiikmTW5O6vkWDqyIXc/eI38WcrK5XYRiphRRDqunF9HZmU1ZndpSHqXVmRznbORY+ZiOL4rvmUU4kE9EDpQ8UOZnoZeqxUgON/UW8aUMYzUIYPF/8KR7I6tqpzuxoeyezMbMbsxFtvNI8ZUQux+RIH9QTLM+L24vvXSvyNas3KzYdC1i1h6FoIFH9unlq6UV1ZrMHZuZ1Mpv0mJuKqszORaC9V3widj785mVijXne71qRr1kchq0xYoH5Tuc5639LWGc2Sk2tK68zta48lKcP0iprV+T4qeJVa78lLol83c22rhdh8h3mDWP0Bz0QtTOb7Vud2WwXiUjWItak3NQwuy460/SBSC9/mT+HmLHrrfVwVKnYXx8WF5ar+hI5bpn4Wiy36qNuP2pnNoZw4EmDhfT3UQHX9O2weWCletA8hZJKc+XpAzGgDGyYjTCb9NtRs8wXq2jUIKJRvIeTFqv6MBVms4ATTalITQfEU0nZpeZRHcd7nuFUmW5faSNbuXesdd8c6YNFMhV95L1hNumD3ct5J+6o0I3mjWcKBfwfQjSeTiJa6RyRG+3kv5pvxBXJfWxLfxArxT3mhzBOeumgY/JOscX8qP6G+MKqd1rMFp7PB5ZB2JTU4eO64npUiZR1m/nxvu5vAtYSUgEDwiffczFTMLRuMZ9iPhs+ER9a9WCddDG6NDDdOrZj0LQ1qsUf7iwWcSjqxE3+WKNGjRo1atSoUaOTp+OtNOR+YVWO7gAAAABJRU5ErkJggg==>

[image5]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFoAAAAZCAYAAACxZDnAAAAEAElEQVR4Xu2YfahNWRjGH6Ehw9AVaZQ7mqZEKCFjFJphMFJIyh/khpISisjQNMkUxvhImuT+IfmYKeYPIvIRSYhRZv5Qk48MzQiloSTG83j3215737PvOeeeK+eyn/q17157nbXWfvZa77vWBXLlypUr1/us1mQaqU2Vu3qQb8nP5DvyafLxa7UiQ8lmso1MgLWbVieyENaW2lTbVaVR5DyZTtqmnjVF7clEson8TZ6QQYkapiHkGBlBBpBD5H+yBGaupOtScpp8QmrIbpiZ4Vh7katkDmlHxpHrsD6qSjJnNvmd1JEOycdlSW3pRUeS1ShstOochPXps1MmXkCyvq7/kC+ie6k3uUW+ju7bkB3k1+hv1xpyBNZX1UmzRDP7ElkJW46VaBkKG61lLbMew2azawVsVi+O7mWW6oVhoCM5Q+phM17G34P1FWoyCvddVdIsGw17oXWw2dYUZRmtD6rQchRJE1VfRuuqEKBwkjb6Q3KKXCRdyJfkJRoarfCltmakyl2dYSFH9T6G9Tcyug/fV2PtDhuD6AZbOaoTlhXKGyXLE9FJshXlJ5gsowtJg9fyfwF7YTc0y2gvd0OzjE6XuxbBwpLqKGQdgH2UtbAxL4C9fy35jfwX1T0H+zC/RPcq3wv7cBXrA7KK3EHhnUGWyjFaH1R1PdF5eClmdLgKQhUzWtK41Od6xDNS5n4P++BfRWVSLfkL8fhmwXJDs+SAMElq61RukizV6I/IcbILcR9arnqxYkYrnhcytByj03X6kUdomGCnwOorl+yBjbsi6WVl7GVUtu0rxWi1vZ38iOTsSBuaVZ5laFZ5qCyjfTV5HnBptv8Eywnjg/KypV2GdhvaV09ChQEexY12k5cj7qsPGYM4ZmcZrUStHYi2fs/R0Cw3WruPLBUz2vtwyWj5o99oBZY9o9Wwkp2S3ueo3GBXY0Zr0EtgSUl/u+YhNke/fwAz39WV/AE7KUpKTDeDe5faSf82rSyjh5FnME/CsSl0bCHDYaFFsTx83qi+gWXV/ijjRyVKL/CUDE6Vq59ZsGdKsLcDHiI+oCjx6rnCl0snyX9hZkhqSy+sVegzTCtlPyyOhjE2LTe6HnF41FX390nfqEx9jCVXSM+oTLsSJUyZ/1ak+K7tjgzT0nXuwuKw5EszfO7o8KFDiEuz+waZS2aSP8l8JCeFDD5M9sFOpTvJWcSmZMmNPgH7d4B2FNdg273PojoKYzLUx6fkq3dU6PAyvav28y1eNbCYmz5MhFK4k3FTo2sp4S8MHaqvg4fab+6V/Vrpk09jVHwCqjJlxeg3ooGwJVMKG5DcAbRk6SSnFaIdy0a8e5OoalSH5CT6Ac10jM6VK1euXC1HrwCgd/MGJ8TTJgAAAABJRU5ErkJggg==>

[image6]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJgAAAAZCAYAAADNLudcAAAFYklEQVR4Xu2Za6hmUxjH/0KRu3ENzXvECCOE5Nok91IyGtMoTc0H13Irt5QPkkvuRCFCotzSNJmQZiiKD5jwwSVDjCSUUJLL8zvPfuy1l73fd6b3zHte56x//Ttnr/2svdf672c9z7PWKxUUFBQUFBQUFEwXTjU+YZxv3D3jrsbNa9NJ7Ge8zfiQcaFx0+ZtbWlcIr+P3QHGTRoWMw9osMjYy9pz9IyL88YEg7QF2xovldtcV12PNa42/t3BH4z7V3Y42vXGd42HGfc2LjdeUN0H2xlfMJ4nd9CDjW8Yr9TMczIW0hnGe4zfGH+V65ID/S4yvm780/h48/Yk0Gap8RPjcca5xqfkC5/3BHjWx8Yr5PqeX13PS2zGDo8YX5SviODDxrXGq1Q7Bo70qepVeprcCVPBLpGvqhRExveME1n7/x18eDRYYLxB/R3sTOPRxq/V7mD0oz/6BVjA61RHvK2Nq4wrVTvdZsbnjE9X/48dGPSDxp2y9iONT6qeyF5y57r3XwuPVkQ0bAOId6ua0YqVhoMRzWYqyAJdDhZAhy/V7mDoymIlIgbCoVYYtzCeaPxL/+3Pu9NMM1bAgXCQ1Pt3ka8KwnSAVYQA58oni1gIkOMmuR2CbVW1nSMXqc0ebC9/F+LuIX/+gup6Tm02maKpCaM+ZJyMG5u0ra1u2dgY1sFo63Iw+tCXe3nGAFHipH1TjJW+PBDnwClSxAq7UR7ZLja+L49W6SaAiVBHYPuZ3OHerNq7cLnxO3mfd+TpGke+WXXaICL2jC8Zf6ls35IL9mx1TfszckFHjY3pYD/Lo/8gB6Mua8NY6UuB+ao8/aUIAVapjkT7Gr+VF/ApCNVfye1DkEE7nahBble9Qpg0Dk1hfFLVBnrGz+W1Is69VF5HpsXwqDGsg0WGOCtpowZD33juhLyGo/hHGxA1GH0ZQxfGQl8GS7GY1lmBcDB2LYFYYR+pruH2lEcs7NhJMqlYDWk4zhEC5CLNN/4kFzFN4wvl9mwoGHO+INqQp4B+3NBUMKyDMf7XjI/Jx8nHv0Zec8VzaWPTlW60KG9+1Po7WG4zlfoORLyM8JkDD+4K4SEAHr5czUngcIRd+hKKu9AlQHwUjkZ2SNoR+275Bzg9ae+HQ9TcKfcjRw+9yV7rh2EdDOwoj04ceVBmXCg/4qEPfQFOj45kiLXGB+RRKP82OUah70AQdboGSn7P7+UORp2AMPluBsdja90lLBgkAFFxm6QdAdjB0oeVPyUrbAhMhYPlICuQHVbIC/MukHEG7SLHQl+i1B/GY/MbhqOMv6sZ3fIUySQ49KN2yEGobUu9gS4B4r33q3n0QQi/z3iMPOqyitP7o8awDkakX228TPU8eBYFfpyDkcLuMD6v+oPHNxh0Djbt+rJCWCldIkX6wwljInmRz2RfMV6r5mB2lovAZLoQAkQNAvjL9ffGA6s2nnuK/FyNjwJIGRSqiDJd4MP9Zjwiv5EgHCwt0gMx/3AU5k6qRk90BeFMFPoTVRtz5hscWl13Ydr15cyKUNjlYIAQTIR61LjMuEZ+SBsDBvsYP5ALQ7QjchHhKPhzUVOEAPycwi4WcT+Ub6vnVTYnyydKqoak7Rh3tFHwciA5CvButu1RZAfXGe9M7BgPTpGOnS0/+h1U2eA8L8vnjW7ohw67VfcDLOa35TZkhC+MJzQs2jEW+s6Vp8d+uyec6Xjj2fKBtTkN/ZkQNgw6Dlz7IQQgEtCfXdwctT9/pgJtD1d/bWnryX964juki7sfZr2+qQAFU49ZrS8nw+xO2WDcpQ0/gyroj1mvL/VcegZ1i4b8OaKggaJvQUFBQUFBQcEswj9eWY6n2Jb9AwAAAABJRU5ErkJggg==>

[image7]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAAAZCAYAAACmRqkJAAADiklEQVR4Xu2XW6hMURjHP6Hcco+EjCi5lGvkUk5uRblEIoo3yosoub56kJRrSUkeJNeSB5I4URLCA3khlDyQlFIil//vrL2aNWtmjz3nDEbtf/06Z9Zas9fe3/5/3/rGLFeuXLly1VvdxAmxWgwSAyJ6Fpe2qLNYJY6J3ea+48X6C2JB8n8Me/0X6i52iVtiWDQXiwd7LX6mcLC41EaKx2K7ucAtF/dEv2R+ovhs5dfwrE/WNaz6iL3itpgl2pdOVxQP/dCco0Iui6diSLKOID0xF7x2oqu4bi5gXAMtFA+s/FrNydoeybqG01Bx3Jzjpph7wKzioWNndBRHxdxgbKv4YM6FXrPFNnNpjTaJOcXpFhG0c2J0NN4QGmHu5mCU1RY4LwIyMBojoFuseD2CcFfcN+dywJGxwyeI3sFnvr9HLAvGYvGy+ovJoin5XBBLzDk73IN6HNfUThXGqoqbwmVXzLkO99VT48VFK003goz7COIRsVMcMpfi44J1sRaZczJBSVNB3BTfxXtxx1z95lB7ZO6l+YNqg3hurp6yfq2YKb4mY8wR+KpaLD6JpdY6x1UTD3pGrIzG/eHww9y+yLvrmZWexF649IaYGk+k6KR4Z6UlYrh4a64e+zLBvtThj+Zcyz7XxLRkPpNac1hkEQ/7ykofAvkA4ri+wTj1M+105SVw6ITrq4kA0g2Qhl4E67D4JmYE42QHhxIvaL9YEczVJN+ukFo4sy2B9DdLyvSK5saac32zldYYH0AePhRuuSrOiw7RXJoqBRBxeLEHKR2KQ4mUx31dormaRUux0Vw7ssaKdq9FOAWHNVt5IabIv7DyubQA+poZj1fT7wLoS4cX6Y3Dv1j1Q6omUcNIHQJJQAlsVnmXVXINn09buTvTUnh+Ms4vlayqFEC/L/VuTDBOCp8V0831mdRJAlo3kcqkNGmU9cL0bxwSaa6hJyRlfNNMyqcdIgSUAOKerGJf6iwdhhf/M0adYz9E2ToldiSfyQ7u4Z836t41aQHE3dTbl2KduTbmjZgULkq02VoXQJx2yVwnQG9LGaAfZW+yiTmuC5QUgufvG2ht+G4tmVc3cZNNVl6DYg0212vNs/QbZRzH4pasClOYOstfmuS6y3fuYfedRqVfC42qSjXwj4jOP/6xnsY++ws31EZhCH5K0izTSNMcx11ArioqiANW+uKpa7ly5cqVq476BcwTxRIOMtnhAAAAAElFTkSuQmCC>

[image8]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAaCAYAAAAue6XIAAACcElEQVR4Xu2WT6hNURTGvxeKIn8j/yYyEQPyJwMMJDFASVEmZox5iNE1eAOT10tKmWBEMUWZeEUSMyUKiUQIEzN5fJ+1N/use84+517uK3W/+rXf22vfs799ztprb6Cv/0dTyWTfmdEkMt13dqPZZCvZQ5aRCcVwm1aSC+hscpkdIbt9oIkGyCbygNwk+wO3yDOy9s/QghaR22S5DwRNIQfIDNcv6aXcIOt8ICet8jR5iXZTip0nX8gqF9MC9XZarn8W2Usuwn73isxPByTaBnshSqNaycw58hnVK1QqfCJnYQajVpCnoU0ls7vIGnIFebNKnXtknw+U6RAZC22VZpKH5DGZk/QfJ9eR31iXkDcrDZFrZKIPpFpK3pInZJ6LpYpm00llUEZPxkEVamJ2O2yM8r9SLfIDtrKclpB3KE6qVv/viIMq1MTsavIG7fvlt5TQo7AU2FIMtUlxjbtDpoU+TfCebIiDKtTEbO3C4wBtHG2gnM7AvkAr6ZPZ16HNqROzKpWligPqHrQYVmc/olhLe2H2sA9EaVdrd+ceNEBOwN7qERfrhdnKNFCZuEy+oTrvVHdV1HUoqB6n0qZTJdFOzqmJ2UbP0okkMzrXvZnN5AMZhh2ZXvHLHPQBJ5nVTs+VJVWBF6jfO78GPofdCeJ9QHeDRzDDSoUyqV+L1ObzmgurHF9hKSS+w0yXHT6acxQNj1zdqrQq3bKUNwtQbTKVjkgtUodGt4rp2HL9/1y6Nd2FXUa6lU7R+6HtuXaSqyjP6zrp650ix8LfPZcmORrodMKNsAtMJ5f2v5YqySBZ7wMZLYTdScbVaF99jYd+ApnHebmMY+0wAAAAAElFTkSuQmCC>