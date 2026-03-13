# Migration Guide - Real/Uman Categories

## Overview
This migration adds support for two major categories: **Real** and **Uman** for organizing subjects.

## What Changed

### Backend
1. Added `majorCategory` field to Subject model (enum: 'Real', 'Uman')
2. Updated subjects API to support filtering by majorCategory
3. All existing subjects will be migrated to 'Real' category

### Frontend
1. Added "Courses" dropdown in header with Real and Uman options
2. Created two new pages: `real.html` and `uman.html`
3. Updated sidebar to load subjects dynamically
4. Added majorCategory selection when creating new subjects

## Running the Migration

To migrate all existing subjects to the 'Real' category:

```bash
cd backend
npm run migrate:subjects
```

This will:
- Connect to your MongoDB database
- Update all subjects without majorCategory to 'Real'
- Display the updated subjects

## Testing

1. Start the backend server:
```bash
cd backend
npm start
```

2. Open the frontend in your browser
3. Check the "Courses" dropdown in the header
4. Click on "Real" to see all Real subjects
5. Click on "Uman" to see Uman subjects (will be empty initially)

## Creating New Subjects

When creating a new subject (owner only):
1. Go to Create Content page
2. Select "Subject" type
3. Choose "Real" or "Uman" from the Major Category dropdown
4. Fill in the rest of the form
5. Submit

The subject will appear in the appropriate category page.
