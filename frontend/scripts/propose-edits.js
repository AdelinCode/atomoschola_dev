// Propose Edits functionality

document.addEventListener('DOMContentLoaded', async function() {
    const user = window.API.getUser();
    
    if (!user) {
        alert('Please login to propose edits');
        window.location.href = 'login.html';
        return;
    }
    
    // Load all published lessons
    await loadLessons();
    
    // Setup form handler
    const form = document.getElementById('proposeEditsForm');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
});

async function loadLessons() {
    try {
        const apiUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/lessons?status=published`);
        const data = await response.json();

        if (data.success) {
            populateLessonSelects(data.data);
        }
    } catch (error) {
        console.error('Error loading lessons:', error);
        alert('Error loading lessons');
    }
}

function populateLessonSelects(lessons) {
    const selects = ['lesson1', 'lesson2', 'lesson3'];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        select.innerHTML = '<option value="">Select a lesson</option>';
        
        lessons.forEach(lesson => {
            const option = document.createElement('option');
            option.value = lesson._id;
            option.textContent = `${lesson.title} (${lesson.category?.name || 'Unknown'})`;
            select.appendChild(option);
        });
    });
}

async function handleSubmit(e) {
    e.preventDefault();
    
    const lesson1 = document.getElementById('lesson1').value;
    const lesson2 = document.getElementById('lesson2').value;
    const lesson3 = document.getElementById('lesson3').value;
    
    // Validate different lessons
    if (lesson1 === lesson2 || lesson1 === lesson3 || lesson2 === lesson3) {
        alert('Please select 3 different lessons');
        return;
    }
    
    const edits = [
        {
            lesson: lesson1,
            editDescription: document.getElementById('description1').value,
            editContent: document.getElementById('content1').value
        },
        {
            lesson: lesson2,
            editDescription: document.getElementById('description2').value,
            editContent: document.getElementById('content2').value
        },
        {
            lesson: lesson3,
            editDescription: document.getElementById('description3').value,
            editContent: document.getElementById('content3').value
        }
    ];
    
    try {
        const apiUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/editor-commission/propose`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.API.getToken()}`
            },
            body: JSON.stringify({ edits })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Edit proposals submitted successfully! The Editor Commission will review them.');
            window.location.href = 'index.html';
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error submitting proposals: ' + error.message);
    }
}
