# Test Checklist - Real/Uman Feature

## Backend Tests

### 1. Rulează Migrarea
```bash
cd backend
npm run migrate:subjects
```
✅ Verifică că toate subjecturile existente au majorCategory = 'Real'

### 2. Testează API
```bash
# Get all subjects
curl http://localhost:5000/api/subjects

# Get only Real subjects
curl http://localhost:5000/api/subjects?majorCategory=Real

# Get only Uman subjects
curl http://localhost:5000/api/subjects?majorCategory=Uman
```

### 3. Creează un Subject Nou (ca Owner)
- Login ca owner
- Mergi la Create Content
- Selectează Subject
- Alege majorCategory = "Uman"
- Creează subjectul
- Verifică că apare în categoria Uman

## Frontend Tests

### 1. Header Dropdown
✅ Verifică că butonul "Courses" apare în header
✅ La hover/click, dropdown-ul se deschide
✅ Dropdown-ul conține "Real" și "Uman"
✅ Click pe "Real" → duce la real.html
✅ Click pe "Uman" → duce la uman.html

### 2. Pagina Real (real.html)
✅ Afișează doar subjecturile din categoria Real
✅ Sidebar-ul afișează doar subjecturile Real
✅ Statisticile sunt corecte (lessons, subjects, domains)
✅ Click pe un subject → duce la pagina subjectului

### 3. Pagina Uman (uman.html)
✅ Afișează doar subjecturile din categoria Uman
✅ Sidebar-ul afișează doar subjecturile Uman
✅ Statisticile sunt corecte
✅ Mesaj "No subjects" dacă nu există subiecte Uman

### 4. Pagina Index (index.html)
✅ Afișează toate subjecturile (Real + Uman)
✅ Sidebar-ul afișează toate subjecturile
✅ Dropdown "Courses" funcționează

### 5. Pagina Subject (subject.html)
✅ Sidebar-ul afișează toate subjecturile
✅ Subjectul curent este marcat ca activ în sidebar

### 6. Pagina Search (search.html)
✅ Sidebar-ul afișează toate subjecturile
✅ Search funcționează normal

### 7. Create Content
✅ Butonul "Subject" apare doar pentru owners
✅ Formularul de subject conține dropdown "Major Category"
✅ Dropdown-ul are opțiunile Real și Uman
✅ Crearea funcționează corect

## Verificări Finale

### Navigare
- [ ] Toate link-urile funcționează
- [ ] Dropdown-urile se închid când dai click în afară
- [ ] Sidebar-ul se actualizează corect pe toate paginile

### Responsive
- [ ] Dropdown-ul funcționează pe mobile
- [ ] Sidebar-ul funcționează pe mobile
- [ ] Paginile Real/Uman arată bine pe mobile

### Performanță
- [ ] Sidebar-ul se încarcă rapid
- [ ] Nu sunt request-uri duplicate
- [ ] Filtrarea funcționează corect

## Probleme Cunoscute
Niciuna momentan.

## Next Steps
1. Populează categoria Uman cu subiecte noi
2. Testează cu utilizatori reali
3. Adaugă mai multe funcționalități dacă e necesar
