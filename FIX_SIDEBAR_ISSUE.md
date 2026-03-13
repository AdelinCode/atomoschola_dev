# Fix Sidebar Issue - Humanities Page

## Problema
Sidebar-ul pe humanities.html afișează toate subjecturile (inclusiv Physics, Chemistry, etc.) în loc să afișeze doar subjecturile Humanities.

## Cauza
În baza de date există subiecte cu:
- `majorCategory` incorect (null, undefined, "Real", "Uman")
- Nume în română ("Științe Reale", "Științe Umane")

## Soluție - Rulează în Ordine

### Pas 1: Cleanup (Șterge subiecte invalide)
```bash
cd backend
npm run cleanup
```

Acest script va:
- Șterge subiecte cu nume în română
- Șterge subiecte fără majorCategory
- Șterge subiecte cu majorCategory invalid (diferit de STEAM/Humanities)
- Afișa subjecturile rămase

### Pas 2: Migrare (Actualizează categoriile)
```bash
npm run migrate:subjects
```

Acest script va:
- Actualiza toate subjecturile fără majorCategory → STEAM
- Actualiza "Real" → "STEAM"
- Actualiza "Uman" → "Humanities"

### Pas 3: Seed Humanities (Opțional)
```bash
npm run seed:uman
```

Creează subiecte Humanities de test:
- History
- Literature
- Philosophy
- Languages

### Pas 4: Restart Backend
```bash
npm start
```

## Verificare

### În Browser
1. Deschide humanities.html
2. Sidebar-ul ar trebui să afișeze DOAR:
   - History
   - Literature
   - Philosophy
   - Languages

3. Deschide steam.html
4. Sidebar-ul ar trebui să afișeze DOAR:
   - Physics
   - Chemistry
   - Mathematics
   - Biology

### În Console (Browser DevTools)
Deschide Console și verifică:
```
Loading subjects for category: Humanities
API Response: { success: true, data: [...] }
Filtered subjects: [{ name: "History", category: "Humanities" }, ...]
```

## Sidebar Retractabil

Pe TOATE paginile (index, steam, humanities, subject, search):
- **Buton toggle** în colțul stânga-sus
- Click pentru a ascunde/afișa
- Starea se salvează automat în localStorage

## Statistici în Timp Real

### Index.html
- Cardurile STEAM și Humanities afișează statistici calculate în timp real
- Se actualizează automat la fiecare refresh

### steam.html & humanities.html
- Hero stats se calculează din subjecturile filtrate
- Se actualizează în timp real

## Troubleshooting

### Sidebar-ul încă afișează toate subjecturile
1. Rulează cleanup: `npm run cleanup`
2. Rulează migrare: `npm run migrate:subjects`
3. Restart backend: `npm start`
4. Hard refresh browser: Ctrl+Shift+R (sau Cmd+Shift+R pe Mac)

### Statisticile arată 0
- Verifică că backend-ul rulează
- Verifică API: http://localhost:5000/api/subjects?majorCategory=STEAM
- Verifică API: http://localhost:5000/api/subjects?majorCategory=Humanities

### Butonul toggle nu funcționează
- Verifică că main.css s-a încărcat
- Verifică consola pentru erori
- Clear cache și refresh

## Comenzi Complete (Copy-Paste)

```bash
cd backend
npm run cleanup
npm run migrate:subjects
npm run seed:uman
npm start
```

Apoi deschide browser-ul și testează!
