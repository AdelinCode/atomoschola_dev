# Real și Uman - Categorii Majore

## Descriere
Platforma acum suportă două categorii majore pentru organizarea subjecturilor:
- **Real**: Științe exacte (Fizică, Chimie, Matematică, Biologie, etc.)
- **Uman**: Științe umaniste (Istorie, Literatură, Filosofie, Limbi străine, etc.)

## Funcționalități

### 1. Dropdown "Courses" în Header
- Apare pe toate paginile
- La hover/click afișează opțiunile "Real" și "Uman"
- Click pe oricare categorie te duce la pagina dedicată

### 2. Pagini Dedicate
- **real.html**: Afișează doar subjecturile din categoria Real
- **uman.html**: Afișează doar subjecturile din categoria Uman
- Fiecare pagină are propriul sidebar cu subjecturile filtrate

### 3. Sidebar Dinamic
- Toate paginile cu sidebar încarcă subjecturile dinamic din baza de date
- Sidebar-ul se actualizează automat când se adaugă subiecte noi
- Pe paginile Real/Uman, sidebar-ul afișează doar subjecturile din categoria respectivă

### 4. Creare Subject
- Doar owner-ii pot crea subiecte noi
- În formularul de creare (Create Content → Subject):
  - Câmp obligatoriu: "Major Category" cu opțiunile Real/Uman
  - Subjectul va apărea în categoria selectată

## Utilizare

### Pentru Utilizatori
1. Click pe "Courses" în header
2. Alege "Real" sau "Uman"
3. Explorează subjecturile din categoria selectată
4. Sidebar-ul afișează toate subjecturile din categoria curentă

### Pentru Owners
1. Mergi la "Create Content"
2. Selectează "Subject"
3. Alege categoria majoră (Real sau Uman)
4. Completează restul formularului
5. Subjectul va apărea în categoria selectată

## Migrare Date Existente

Toate subjecturile existente vor fi automat în categoria "Real".

Pentru a rula migrarea:
```bash
cd backend
npm run migrate:subjects
```

## Structura Tehnică

### Backend
- Model: `backend/models/Subject.js` - adăugat câmp `majorCategory`
- Route: `backend/routes/subjects.js` - suport pentru filtrare după `majorCategory`
- Script: `backend/scripts/migrate-subjects-category.js` - migrare date

### Frontend
- Pagini: `frontend/real.html`, `frontend/uman.html`
- Script: `frontend/scripts/category-page.js` - logică pentru paginile de categorie
- Actualizări: `main.js`, `create-content.js`, `subject.js`, `search.js` - sidebar dinamic

## Note
- Sidebar-ul se actualizează automat pe toate paginile
- Filtrarea se face la nivel de API pentru performanță
- Categoriile sunt case-sensitive: "Real" și "Uman" (cu majusculă)
