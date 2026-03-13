# 🚀 Quick Start - STEAM & Humanities

## Problema Curentă
Sidebar-ul pe humanities.html afișează toate subjecturile (Physics, Chemistry, etc.) în loc să afișeze doar Humanities.

## Soluție Rapidă (3 Comenzi)

```bash
cd backend
npm run cleanup
npm run migrate:subjects
npm start
```

## Ce Face Fiecare Comandă

### 1. `npm run cleanup`
Șterge:
- Subiecte cu nume în română ("Științe Reale", "Științe Umane")
- Subiecte fără majorCategory
- Subiecte cu categorii invalide

### 2. `npm run migrate:subjects`
Actualizează:
- Toate subjecturile → categoria corectă (STEAM sau Humanities)
- "Real" → "STEAM"
- "Uman" → "Humanities"

### 3. `npm start`
Pornește backend-ul

## (Opțional) Adaugă Subiecte Humanities

```bash
npm run seed:uman
```

Creează: History, Literature, Philosophy, Languages

## Testare

### 1. Index Page (index.html)
✅ 2 carduri mari: STEAM și Humanities
✅ Sidebar cu doar 2 opțiuni: STEAM și Humanities
✅ Buton toggle în stânga-sus
✅ Statistici în timp real

### 2. STEAM Page (steam.html)
✅ Sidebar cu DOAR: Physics, Chemistry, Mathematics, Biology
✅ Grid cu subiecte STEAM
✅ Buton toggle funcțional
✅ Statistici calculate din subiecte STEAM

### 3. Humanities Page (humanities.html)
✅ Sidebar cu DOAR: History, Literature, Philosophy, Languages
✅ Grid cu subiecte Humanities
✅ Buton toggle funcțional
✅ Statistici calculate din subiecte Humanities

### 4. Sidebar Retractabil
✅ Buton toggle pe TOATE paginile
✅ Click → ascunde/afișează sidebar
✅ Starea se salvează în localStorage
✅ Funcționează pe: index, steam, humanities, subject, search

## Verificare Rapidă

Deschide Console în browser (F12) și verifică:
```
Loading subjects for category: Humanities
Filtered subjects: [{ name: "History", category: "Humanities" }, ...]
```

Dacă vezi Physics, Chemistry în lista Humanities → rulează din nou cleanup și migrare!

## All-in-One Command

```bash
cd backend && npm run cleanup && npm run migrate:subjects && npm run seed:uman && npm start
```

## ✅ Checklist
- [ ] Rulat cleanup
- [ ] Rulat migrare
- [ ] Backend pornit
- [ ] Index.html afișează 2 carduri
- [ ] STEAM page afișează doar subiecte STEAM
- [ ] Humanities page afișează doar subiecte Humanities
- [ ] Sidebar retractabil funcționează
- [ ] Statistici se actualizează corect

## 🎉 Gata!
După aceste comenzi, totul ar trebui să funcționeze perfect!
