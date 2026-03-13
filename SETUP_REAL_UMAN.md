# Setup Real și Uman - Ghid Complet

## 🎯 Ce am implementat

Am creat un sistem de categorii majore pentru subiecte:
- **Real**: Științe exacte (Fizică, Chimie, Matematică, Biologie)
- **Uman**: Științe umaniste (Istorie, Literatură, Filosofie, Limbi)

## 📋 Pași de Setup

### 1. Rulează Migrarea (OBLIGATORIU)
Acest pas actualizează toate subjecturile existente să aibă categoria "Real":

```bash
cd backend
npm run migrate:subjects
```

### 2. (Opțional) Adaugă Subiecte Uman de Test
Pentru a testa categoria Uman cu subiecte de exemplu:

```bash
cd backend
npm run seed:uman
```

Acest script va crea:
- History (Istorie)
- Literature (Literatură)
- Philosophy (Filosofie)
- Languages (Limbi străine)

### 3. Restart Backend
```bash
cd backend
npm start
```

### 4. Testează Frontend
Deschide aplicația în browser și verifică:

#### ✅ Header
- Butonul "Courses" apare în header
- La hover/click se deschide dropdown cu "Real" și "Uman"

#### ✅ Pagina Real (real.html)
- Click pe "Real" din dropdown
- Vezi doar subjecturile Real (Physics, Chemistry, Math, Biology)
- Sidebar-ul afișează doar subjecturile Real

#### ✅ Pagina Uman (uman.html)
- Click pe "Uman" din dropdown
- Vezi subjecturile Uman (dacă ai rulat seed-ul)
- Sidebar-ul afișează doar subjecturile Uman

#### ✅ Creare Subject Nou (doar pentru Owner)
- Login ca owner
- Mergi la "Create Content"
- Click pe "Subject"
- Selectează "Real" sau "Uman" din dropdown
- Completează formularul
- Subjectul apare în categoria selectată

## 🔧 Modificări Tehnice

### Backend
1. **Subject Model** (`backend/models/Subject.js`)
   - Adăugat câmp `majorCategory` (enum: 'Real', 'Uman')
   - Default: 'Real'

2. **Subjects Route** (`backend/routes/subjects.js`)
   - Suport pentru query parameter `?majorCategory=Real` sau `?majorCategory=Uman`
   - Actualizat POST pentru a accepta majorCategory

3. **Scripts**
   - `migrate-subjects-category.js` - migrare date existente
   - `seed-uman-subjects.js` - seed subiecte Uman de test

### Frontend
1. **Pagini Noi**
   - `real.html` - pagină pentru categoria Real
   - `uman.html` - pagină pentru categoria Uman

2. **Scripts**
   - `category-page.js` - logică pentru paginile Real/Uman
   - `main.js` - adăugat dropdown "Courses" în header
   - `create-content.js` - adăugat formular pentru Subject cu majorCategory
   - `subject.js` - sidebar dinamic
   - `search.js` - sidebar dinamic

3. **Sidebar Dinamic**
   - Toate paginile cu sidebar încarcă subjecturile dinamic
   - Pe Real/Uman, sidebar-ul este filtrat după categorie

## 🎨 UI/UX

### Dropdown "Courses"
- Poziționat în header, înainte de "Staff"
- Icon: 🎓 (fas fa-graduation-cap)
- Hover: se deschide dropdown
- Opțiuni:
  - Real (icon: ⚛️ fas fa-atom)
  - Uman (icon: 📖 fas fa-book-reader)

### Pagini Categorie
- Hero section cu icon specific
- Grid cu subiecte filtrate
- Statistici actualizate
- Sidebar filtrat

### Formular Subject
- Câmp nou: "Major Category"
- Dropdown cu Real/Uman
- Validare obligatorie
- Doar pentru owners

## 🚀 Cum să Folosești

### Ca Utilizator
1. Click pe "Courses" în header
2. Alege "Real" sau "Uman"
3. Explorează subjecturile
4. Click pe un subject pentru a vedea domeniile și lecțiile

### Ca Owner
1. Creează subiecte noi cu categoria dorită
2. Subjecturile apar automat în categoria selectată
3. Sidebar-ul se actualizează automat

## 📝 Note Importante

- Toate subjecturile existente sunt în categoria "Real" după migrare
- Sidebar-ul se încarcă dinamic pe toate paginile
- Filtrarea se face la nivel de API pentru performanță
- Categoriile sunt case-sensitive: "Real" și "Uman"

## 🐛 Troubleshooting

### Dropdown-ul nu apare
- Verifică că main.js se încarcă corect
- Verifică consola pentru erori JavaScript

### Sidebar-ul nu se încarcă
- Verifică că API-ul funcționează (http://localhost:5000/api/subjects)
- Verifică consola pentru erori

### Subjecturile nu apar în categoria corectă
- Rulează din nou migrarea
- Verifică că subjecturile au câmpul majorCategory setat

## ✅ Gata!
Acum ai un sistem complet de categorii Real și Uman pentru subiecte!
