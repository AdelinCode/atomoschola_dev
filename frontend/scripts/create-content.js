// Create Content Page
let quill;
let subjectsData = [];
let currentContentType = null;
let attachments = []; // Array to store attachments

// Check authentication and permissions
document.addEventListener('DOMContentLoaded', async function() {
    const user = window.API.getUser();
    
    if (!user) {
        alert('Please login to create content');
        window.location.href = 'login.html';
        return;
    }
    
    // Check if user has permission to create content
    if (!['creator', 'editor', 'staff', 'owner'].includes(user.userType)) {
        alert('You do not have permission to create content');
        window.location.href = 'index.html';
        return;
    }
    
    // Initialize Quill editor with KaTeX support
    quill = new Quill('#editor', {
        theme: 'snow',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'script': 'sub'}, { 'script': 'super' }],
                [{ 'indent': '-1'}, { 'indent': '+1' }],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'align': [] }],
                ['link', 'image', 'formula'],
                ['code-block'],
                ['clean']
            ],
            formula: true
        }
    });
    
    // Add KaTeX rendering
    window.katex = katex;
    
    // Load subjects
    await loadSubjects();
    
    // Setup event listeners
    setupEventListeners();
});

// Load subjects from API
async function loadSubjects() {
    try {
        const response = await window.API.subjects.getAll();
        if (response.success) {
            subjectsData = response.data;
            populateSubjectSelects();
        }
    } catch (error) {
        console.error('Error loading subjects:', error);
        alert('Error loading subjects');
    }
}

// Populate subject dropdowns
function populateSubjectSelects() {
    const selects = ['lessonSubject', 'domainSubject', 'categorySubject'];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        select.innerHTML = '<option value="">Select Subject</option>';
        
        subjectsData.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject._id;
            option.textContent = subject.name;
            option.dataset.slug = subject.slug;
            select.appendChild(option);
        });
    });
}

// Setup event listeners
function setupEventListeners() {
    // Content type buttons
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.dataset.type;
            selectContentType(type);
        });
    });
    
    // Subject change for lesson
    document.getElementById('lessonSubject').addEventListener('change', function() {
        const subjectId = this.value;
        populateDomains('lessonDomain', subjectId);
    });
    
    // Domain change for lesson
    document.getElementById('lessonDomain').addEventListener('change', function() {
        const domainId = this.value;
        populateCategories('lessonCategory', domainId);
    });
    
    // Lesson type change
    document.getElementById('lessonType').addEventListener('change', function() {
        const type = this.value;
        const videoUrlGroup = document.getElementById('videoUrlGroup');
        const contentEditorGroup = document.getElementById('contentEditorGroup');
        const videoUrlInput = document.getElementById('videoUrl');
        
        if (type === 'video') {
            // Show video URL field, hide editor
            videoUrlGroup.style.display = 'block';
            contentEditorGroup.style.display = 'none';
            videoUrlInput.required = true;
        } else {
            // Show editor, hide video URL
            videoUrlGroup.style.display = 'none';
            contentEditorGroup.style.display = 'block';
            videoUrlInput.required = false;
        }
    });
    
    // Subject change for category
    document.getElementById('categorySubject').addEventListener('change', function() {
        const subjectId = this.value;
        populateDomains('categoryDomain', subjectId);
    });
    
    // Auto-generate slugs
    document.getElementById('lessonTitle')?.addEventListener('input', function() {
        document.getElementById('lessonSlug').value = generateSlug(this.value);
    });
    
    document.getElementById('domainName')?.addEventListener('input', function() {
        document.getElementById('domainSlug').value = generateSlug(this.value);
    });
    
    document.getElementById('categoryName')?.addEventListener('input', function() {
        document.getElementById('categorySlug').value = generateSlug(this.value);
    });
    
    // Form submissions
    document.getElementById('createLessonForm').addEventListener('submit', handleLessonSubmit);
    document.getElementById('createDomainForm').addEventListener('submit', handleDomainSubmit);
    document.getElementById('createCategoryForm').addEventListener('submit', handleCategorySubmit);
    
    // Attachment functionality
    document.getElementById('addAttachmentBtn')?.addEventListener('click', addAttachment);
}

// Select content type
function selectContentType(type) {
    currentContentType = type;
    
    // Update buttons
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-type="${type}"]`).classList.add('active');
    
    // Show appropriate form
    document.querySelectorAll('.content-form').forEach(form => {
        form.classList.remove('active');
    });
    document.getElementById(`${type}Form`).classList.add('active');
}

// Populate domains dropdown
function populateDomains(selectId, subjectId) {
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">Select Domain</option>';
    
    const subject = subjectsData.find(s => s._id === subjectId);
    if (subject && subject.domains) {
        subject.domains.forEach(domain => {
            const option = document.createElement('option');
            option.value = domain._id;
            option.textContent = domain.name;
            select.appendChild(option);
        });
    }
}

// Populate categories dropdown
function populateCategories(selectId, domainId) {
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">Select Category</option>';
    
    const categoryHelp = document.getElementById('categoryHelp');
    let hasCategories = false;
    
    // Find domain in subjects
    for (const subject of subjectsData) {
        if (subject.domains) {
            const domain = subject.domains.find(d => d._id === domainId);
            if (domain && domain.categories && domain.categories.length > 0) {
                domain.categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category._id;
                    option.textContent = category.name;
                    select.appendChild(option);
                    hasCategories = true;
                });
                break;
            }
        }
    }
    
    // Show/hide help message
    if (categoryHelp) {
        categoryHelp.style.display = hasCategories ? 'none' : 'block';
    }
}

// Generate slug from text
function generateSlug(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Handle lesson submission
async function handleLessonSubmit(e) {
    e.preventDefault();
    
    const user = window.API.getUser();
    const type = document.getElementById('lessonType').value;
    const category = document.getElementById('lessonCategory').value;
    
    // Validate category selection
    if (!category) {
        alert('Please select a category. If no categories are available, you need to create a Domain and Category first.');
        return;
    }
    
    const loading = document.getElementById('loading');
    loading.classList.add('active');
    
    try {
        let content = '';
        
        // Get content based on type
        if (type === 'video') {
            const videoUrl = document.getElementById('videoUrl').value;
            if (!videoUrl) {
                alert('Please enter a YouTube video URL');
                loading.classList.remove('active');
                return;
            }
            
            // Extract YouTube video ID
            const videoId = extractYouTubeId(videoUrl);
            if (!videoId) {
                alert('Invalid YouTube URL. Please use a valid YouTube video link.');
                loading.classList.remove('active');
                return;
            }
            
            // Create embedded video HTML
            content = `<div class="video-container" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">
                <iframe src="https://www.youtube.com/embed/${videoId}" 
                        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                </iframe>
            </div>`;
        } else {
            content = quill.root.innerHTML;
        }
        
        const lessonData = {
            title: document.getElementById('lessonTitle').value,
            slug: document.getElementById('lessonSlug').value,
            description: document.getElementById('lessonDescription').value,
            content: content,
            type: type,
            category: category,
            isPremium: false,
            attachments: attachments.map(att => ({
                name: att.name,
                url: att.url,
                type: att.type
            })),
            creators: [user._id],
            status: (user.userType === 'owner' || user.userType === 'staff') ? 'published' : 'pending_review'
        };
        
        if (user.userType === 'owner' || user.userType === 'staff') {
            const response = await window.API.lessons.create(lessonData);
            
            if (response.success) {
                alert('Lesson created successfully!');
                window.location.href = `lesson.html?id=${response.data._id}`;
            } else {
                alert('Error creating lesson: ' + response.message);
            }
        } else {
            const apiUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
            const response = await fetch(`${apiUrl}/pending-requests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.API.getToken()}`
                },
                body: JSON.stringify({
                    type: 'lesson',
                    data: lessonData
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('Lesson request submitted for approval! The owner will review it soon.');
                window.location.href = 'index.html';
            } else {
                alert('Error submitting request: ' + result.message);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error creating lesson: ' + error.message);
    } finally {
        loading.classList.remove('active');
    }
}

// Extract YouTube video ID from URL
function extractYouTubeId(url) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
}

// Handle domain submission
async function handleDomainSubmit(e) {
    e.preventDefault();
    
    const loading = document.getElementById('loading');
    loading.classList.add('active');
    
    try {
        const user = window.API.getUser();
        const subjectId = document.getElementById('domainSubject').value;
        const domainData = {
            name: document.getElementById('domainName').value,
            slug: document.getElementById('domainSlug').value,
            description: document.getElementById('domainDescription').value,
            subject: subjectId
        };
        
        // If user is owner or staff, create directly. Otherwise, send pending request
        if (user.userType === 'owner' || user.userType === 'staff') {
            const apiUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
            const response = await fetch(`${apiUrl}/subjects/${subjectId}/domains`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.API.getToken()}`
                },
                body: JSON.stringify(domainData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('Domain created successfully!');
                window.location.href = 'index.html';
            } else {
                alert('Error creating domain: ' + result.message);
            }
        } else {
            // Send pending request
            const apiUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
            const response = await fetch(`${apiUrl}/pending-requests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.API.getToken()}`
                },
                body: JSON.stringify({
                    type: 'domain',
                    data: domainData
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('Domain request submitted for approval! The owner will review it soon.');
                window.location.href = 'index.html';
            } else {
                alert('Error submitting request: ' + result.message);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error: ' + error.message);
    } finally {
        loading.classList.remove('active');
    }
}

// Handle category submission
async function handleCategorySubmit(e) {
    e.preventDefault();
    
    const loading = document.getElementById('loading');
    loading.classList.add('active');
    
    try {
        const user = window.API.getUser();
        const subjectId = document.getElementById('categorySubject').value;
        const domainId = document.getElementById('categoryDomain').value;
        const categoryData = {
            name: document.getElementById('categoryName').value,
            slug: document.getElementById('categorySlug').value,
            description: document.getElementById('categoryDescription').value,
            domain: domainId
        };
        
        const apiUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
        
        if (user.userType === 'owner' || user.userType === 'staff') {
            const response = await fetch(`${apiUrl}/subjects/${subjectId}/domains/${domainId}/categories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.API.getToken()}`
                },
                body: JSON.stringify(categoryData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('Category created successfully!');
                window.location.href = 'index.html';
            } else {
                alert('Error creating category: ' + result.message);
            }
        } else {
            const response = await fetch(`${apiUrl}/pending-requests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.API.getToken()}`
                },
                body: JSON.stringify({
                    type: 'category',
                    data: categoryData
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('Category request submitted for approval! The owner will review it soon.');
                window.location.href = 'index.html';
            } else {
                alert('Error submitting request: ' + result.message);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error creating category: ' + error.message);
    } finally {
        loading.classList.remove('active');
    }
}

// Attachment management functions
function addAttachment() {
    const nameInput = document.getElementById('attachmentName');
    const urlInput = document.getElementById('attachmentUrl');
    const typeSelect = document.getElementById('attachmentType');
    
    const name = nameInput.value.trim();
    const url = urlInput.value.trim();
    const type = typeSelect.value;
    
    if (!name || !url) {
        alert('Please enter both file name and URL');
        return;
    }
    
    // Validate URL
    try {
        new URL(url);
    } catch (e) {
        alert('Please enter a valid URL');
        return;
    }
    
    // Add to attachments array
    const attachment = {
        name: name,
        url: url,
        type: type,
        id: Date.now() // Simple ID for removal
    };
    
    attachments.push(attachment);
    
    // Clear inputs
    nameInput.value = '';
    urlInput.value = '';
    typeSelect.value = 'document';
    
    // Update display
    displayAttachments();
}

function removeAttachment(id) {
    attachments = attachments.filter(att => att.id !== id);
    displayAttachments();
}

function displayAttachments() {
    const container = document.getElementById('attachmentsList');
    
    if (attachments.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    const html = attachments.map(att => {
        const icon = getAttachmentIcon(att.type);
        return `
            <div class="attachment-item">
                <div class="attachment-info">
                    <div class="attachment-icon" style="background: ${getAttachmentColor(att.type)};">
                        <i class="${icon}"></i>
                    </div>
                    <div class="attachment-details">
                        <h5>${att.name}</h5>
                        <small>${att.type.charAt(0).toUpperCase() + att.type.slice(1)} • ${getDomainFromUrl(att.url)}</small>
                    </div>
                </div>
                <button type="button" class="attachment-remove" onclick="removeAttachment(${att.id})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

function getAttachmentIcon(type) {
    const icons = {
        document: 'fas fa-file-word',
        pdf: 'fas fa-file-pdf',
        spreadsheet: 'fas fa-file-excel',
        presentation: 'fas fa-file-powerpoint',
        image: 'fas fa-file-image',
        video: 'fas fa-file-video',
        other: 'fas fa-file'
    };
    return icons[type] || 'fas fa-file';
}

function getAttachmentColor(type) {
    const colors = {
        document: '#2b579a',
        pdf: '#dc3545',
        spreadsheet: '#107c41',
        presentation: '#d24726',
        image: '#6f42c1',
        video: '#fd7e14',
        other: '#6c757d'
    };
    return colors[type] || '#6c757d';
}

function getDomainFromUrl(url) {
    try {
        const domain = new URL(url).hostname;
        if (domain.includes('drive.google.com')) return 'Google Drive';
        if (domain.includes('dropbox.com')) return 'Dropbox';
        if (domain.includes('onedrive.live.com')) return 'OneDrive';
        if (domain.includes('sharepoint.com')) return 'SharePoint';
        return domain;
    } catch (e) {
        return 'External Link';
    }
}

// Make removeAttachment available globally for onclick handlers
window.removeAttachment = removeAttachment;