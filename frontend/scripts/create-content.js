// Create Content Page
let quill;
let translationQuill;
let subjectsData = [];
let currentContentType = null;
let attachments = []; // Array to store attachments

// Translation state
let translationOriginalLesson = null; // full lesson object
let translationSearchTimeout = null;

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
    
    // Hide subject button for non-owners
    if (user.userType !== 'owner') {
        const subjectBtn = document.querySelector('[data-type="subject"]');
        if (subjectBtn) {
            subjectBtn.style.display = 'none';
        }
    }
    
    // Show translation button for eligible roles
    if (['creator', 'editor', 'staff', 'owner'].includes(user.userType)) {
        const translationBtn = document.getElementById('translationTypeBtn');
        if (translationBtn) translationBtn.style.display = '';
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
    
    // Initialize translation Quill editor
    translationQuill = new Quill('#translationEditor', {
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

    // Load subjects
    await loadSubjects();
    
    // Setup event listeners
    setupEventListeners();

    // Olympiad checkbox toggle
    const olympiadCheckbox = document.getElementById('lessonIsOlympiad');
    if (olympiadCheckbox) {
        olympiadCheckbox.addEventListener('change', function () {
            const fields = document.getElementById('olympiadFields');
            if (fields) fields.style.display = this.checked ? '' : 'none';
        });
    }

    // Handle ?type=translation&lessonId= URL params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('type') === 'translation') {
        selectContentType('translation');
        // loadTranslationLanguages is called inside selectContentType
        const lessonId = urlParams.get('lessonId');
        if (lessonId) {
            await preloadTranslationLesson(lessonId);
        }
    }
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
    
    document.getElementById('subjectName')?.addEventListener('input', function() {
        document.getElementById('subjectSlug').value = generateSlug(this.value);
    });
    
    // Form submissions
    document.getElementById('createSubjectForm').addEventListener('submit', handleSubjectSubmit);
    document.getElementById('createLessonForm').addEventListener('submit', handleLessonSubmit);
    document.getElementById('createDomainForm').addEventListener('submit', handleDomainSubmit);
    document.getElementById('createCategoryForm').addEventListener('submit', handleCategorySubmit);
    document.getElementById('createTranslationForm').addEventListener('submit', handleTranslationSubmit);
    
    // Translation: original lesson search
    const origSearch = document.getElementById('translationOriginalSearch');
    if (origSearch) {
        origSearch.addEventListener('input', function() {
            clearTimeout(translationSearchTimeout);
            const q = this.value.trim();
            if (q.length < 2) {
                document.getElementById('translationOriginalResults').style.display = 'none';
                return;
            }
            translationSearchTimeout = setTimeout(() => searchOriginalLesson(q), 300);
        });
    }

    // Translation: target language dropdown change
    const targetLangSelect = document.getElementById('translationTargetLanguage');
    if (targetLangSelect) {
        targetLangSelect.addEventListener('change', function() {
            const customGroup = document.getElementById('translationCustomLangGroup');
            const customInput = document.getElementById('translationCustomLang');
            if (this.value === '__other__') {
                customGroup.style.display = 'block';
                customInput.required = true;
            } else {
                customGroup.style.display = 'none';
                customInput.required = false;
                customInput.value = '';
            }
            validateTranslationLanguage();
        });
    }

    // Translation: custom language input change
    const customLangInput = document.getElementById('translationCustomLang');
    if (customLangInput) {
        customLangInput.addEventListener('input', validateTranslationLanguage);
    }

    // Translation: title slug
    document.getElementById('translationTitle')?.addEventListener('input', function() {
        document.getElementById('translationSlug').value = generateSlug(this.value);
    });
    
    // Attachment functionality
    document.getElementById('addAttachmentBtn')?.addEventListener('click', addAttachment);

    // Tags functionality
    setupTagInput();
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
    
    // Check if user is owner for subject creation
    if (type === 'subject') {
        const user = window.API.getUser();
        if (user.userType !== 'owner') {
            alert('Only owners can create subjects');
            return;
        }
    }

    // Load language options when translation form is selected
    if (type === 'translation') {
        loadTranslationLanguages();
    }
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

// Handle subject submission
async function handleSubjectSubmit(e) {
    e.preventDefault();
    
    const user = window.API.getUser();
    
    // Only owner can create subjects
    if (user.userType !== 'owner') {
        alert('Only owners can create subjects');
        return;
    }
    
    const loading = document.getElementById('loading');
    loading.classList.add('active');
    
    try {
        const subjectData = {
            name: document.getElementById('subjectName').value,
            slug: document.getElementById('subjectSlug').value,
            icon: document.getElementById('subjectIcon').value,
            description: document.getElementById('subjectDescription').value,
            majorCategory: document.getElementById('subjectMajorCategory').value,
            isPremium: false
        };
        
        const response = await window.API.subjects.create(subjectData);
        
        if (response.success) {
            alert('Subject created successfully!');
            window.location.href = 'index.html';
        } else {
            alert('Error creating subject: ' + response.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error creating subject: ' + error.message);
    } finally {
        loading.classList.remove('active');
    }
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
        
        const isOlympiad = document.getElementById('lessonIsOlympiad')?.checked || false;
        const lessonData = {
            title: document.getElementById('lessonTitle').value,
            slug: document.getElementById('lessonSlug').value,
            description: document.getElementById('lessonDescription').value,
            content: content,
            type: type,
            category: category,
            isPremium: false,
            language: document.getElementById('lessonLanguage').value,
            level: document.getElementById('lessonLevel').value,
            difficulty: document.getElementById('lessonDifficulty')?.value || null,
            problemYear: parseInt(document.getElementById('lessonProblemYear')?.value) || null,
            isOlympiad: isOlympiad,
            olympiadName: isOlympiad ? (document.getElementById('lessonOlympiadName')?.value || null) : null,
            olympiadYear: isOlympiad ? (parseInt(document.getElementById('lessonOlympiadYear')?.value) || null) : null,
            tags: getTags(),
            attachments: attachments.map(att => ({
                name: att.name,
                url: att.url,
                type: att.type
            })),
            creators: [user._id],
            status: user.userType === 'owner' ? 'published' : 'pending_review'
        };
        
        if (user.userType === 'owner') {
            // Owner publishes directly
            const response = await window.API.lessons.create(lessonData);
            
            if (response.success) {
                alert('Lesson created successfully!');
                window.location.href = `lesson.html?id=${response.data._id}`;
            } else {
                alert('Error creating lesson: ' + response.message);
            }
        } else {
            // Creator, editor, staff — all go through peer review
            const apiUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
            const response = await fetch(`${apiUrl}/lesson-reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.API.getToken()}`
                },
                body: JSON.stringify({ lessonData })
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('Lesson submitted for peer review! Editors can now join your review panel from the Review Dashboard.');
                window.location.href = 'lesson-review.html';
            } else {
                alert('Error submitting for review: ' + result.message);
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
            slug: generateSlug(document.getElementById('domainName').value),
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
            slug: generateSlug(document.getElementById('categoryName').value),
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

// ── Tags ──────────────────────────────────────────────────────────────────────

let currentTags = [];

function setupTagInput() {
    const input = document.getElementById('tagInput');
    if (!input) return;

    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(this.value.trim());
            this.value = '';
        }
        if (e.key === 'Backspace' && this.value === '' && currentTags.length > 0) {
            removeTag(currentTags[currentTags.length - 1]);
        }
    });
}

function addTag(text) {
    if (!text || currentTags.includes(text) || currentTags.length >= 10) return;
    currentTags.push(text);
    renderTags();
}

function removeTag(tag) {
    currentTags = currentTags.filter(t => t !== tag);
    renderTags();
}

function renderTags() {
    const container = document.getElementById('tagsContainer');
    const input = document.getElementById('tagInput');
    // Remove old tag pills
    container.querySelectorAll('.tag-pill').forEach(el => el.remove());
    // Re-insert before input
    currentTags.forEach(tag => {
        const pill = document.createElement('span');
        pill.className = 'tag-pill';
        pill.style.cssText = 'display:inline-flex; align-items:center; gap:5px; background:#e9ecef; color:#333; padding:4px 10px; border-radius:20px; font-size:13px; font-weight:500;';
        pill.innerHTML = `${tag} <span onclick="removeTag('${tag}')" style="cursor:pointer; font-size:16px; line-height:1; color:#888;">&times;</span>`;
        container.insertBefore(pill, input);
    });
}

function getTags() {
    return currentTags;
}

window.removeTag = removeTag;

// ── Translation feature ───────────────────────────────────────────────────────

// Fetch languages from API and populate the target language dropdown
async function loadTranslationLanguages() {
    const select = document.getElementById('translationTargetLanguage');
    if (!select) return;

    try {
        const apiUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/lessons/languages`, {
            headers: { 'Authorization': `Bearer ${window.API.getToken()}` }
        });
        const result = await response.json();

        // Keep the default empty option, then append distinct languages
        select.innerHTML = '<option value="">Select language...</option>';
        if (result.success && Array.isArray(result.data)) {
            result.data.forEach(lang => {
                const opt = document.createElement('option');
                opt.value = lang;
                opt.textContent = lang.charAt(0).toUpperCase() + lang.slice(1);
                select.appendChild(opt);
            });
        }
        // Always add "Other language..." option
        const otherOpt = document.createElement('option');
        otherOpt.value = '__other__';
        otherOpt.textContent = 'Other language...';
        select.appendChild(otherOpt);
    } catch (err) {
        console.error('Error loading languages:', err);
    }
}

// Search for a published lesson by title
async function searchOriginalLesson(query) {
    const resultsEl = document.getElementById('translationOriginalResults');
    if (!resultsEl) return;

    try {
        const apiUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
        const response = await fetch(
            `${apiUrl}/lessons?status=published&search=${encodeURIComponent(query)}&limit=10`,
            { headers: { 'Authorization': `Bearer ${window.API.getToken()}` } }
        );
        const result = await response.json();

        resultsEl.innerHTML = '';
        if (result.success && result.data && result.data.length > 0) {
            result.data.forEach(lesson => {
                const item = document.createElement('div');
                item.style.cssText = 'padding:10px 14px; cursor:pointer; border-bottom:1px solid #f0f0f0; font-size:14px;';
                item.textContent = lesson.title + (lesson.language ? ` [${lesson.language}]` : '');
                item.addEventListener('mouseenter', () => item.style.background = '#f8f9fa');
                item.addEventListener('mouseleave', () => item.style.background = '');
                item.addEventListener('click', () => selectOriginalLesson(lesson));
                resultsEl.appendChild(item);
            });
            resultsEl.style.display = 'block';
        } else {
            resultsEl.innerHTML = '<div style="padding:10px 14px; color:#6c757d; font-size:14px;">Niciun curs găsit.</div>';
            resultsEl.style.display = 'block';
        }
    } catch (err) {
        console.error('Error searching lessons:', err);
    }
}

// Set the selected original lesson and pre-populate form fields
function selectOriginalLesson(lesson) {
    translationOriginalLesson = lesson;

    document.getElementById('translationOriginalId').value = lesson._id;
    document.getElementById('translationOriginalSearch').value = '';
    document.getElementById('translationOriginalResults').style.display = 'none';

    const selectedEl = document.getElementById('translationOriginalSelected');
    selectedEl.style.display = 'block';
    selectedEl.innerHTML = `<i class="fas fa-check-circle"></i> <strong>${lesson.title}</strong>${lesson.language ? ` <span style="color:#6c757d;">(${lesson.language})</span>` : ''}
        <button type="button" onclick="clearOriginalLesson()" style="margin-left:10px; background:none; border:none; color:#dc3545; cursor:pointer; font-size:13px;"><i class="fas fa-times"></i> Schimbă</button>`;

    // Pre-populate title, description, content
    const titleInput = document.getElementById('translationTitle');
    const descInput = document.getElementById('translationDescription');
    if (titleInput && !titleInput.value) titleInput.value = lesson.title;
    if (titleInput) document.getElementById('translationSlug').value = generateSlug(titleInput.value);
    if (descInput && !descInput.value) descInput.value = lesson.description || '';
    if (translationQuill && lesson.content) {
        translationQuill.root.innerHTML = lesson.content;
    }

    // Store the original lesson's category so the translation inherits it
    const categoryIdField = document.getElementById('translationCategoryId');
    if (categoryIdField) {
        const catId = (lesson.category && typeof lesson.category === 'object') ? lesson.category._id : (lesson.category || '');
        categoryIdField.value = catId;
    }

    // Validate language after selecting original
    validateTranslationLanguage();
}

// Pre-load original lesson by ID (called from URL params)
async function preloadTranslationLesson(lessonId) {
    try {
        const apiUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/lessons/${lessonId}`, {
            headers: { 'Authorization': `Bearer ${window.API.getToken()}` }
        });
        const result = await response.json();
        if (result.success && result.data) {
            selectOriginalLesson(result.data);
        }
    } catch (err) {
        console.error('Error pre-loading lesson:', err);
    }
}

// Clear the selected original lesson
function clearOriginalLesson() {
    translationOriginalLesson = null;
    document.getElementById('translationOriginalId').value = '';
    document.getElementById('translationOriginalSelected').style.display = 'none';
    document.getElementById('translationOriginalSearch').value = '';
    document.getElementById('translationLangError').style.display = 'none';
}
window.clearOriginalLesson = clearOriginalLesson;

// Get the effective target language value (select or custom input)
function getTargetLanguage() {
    const select = document.getElementById('translationTargetLanguage');
    if (!select) return '';
    if (select.value === '__other__') {
        return (document.getElementById('translationCustomLang')?.value || '').trim();
    }
    return select.value;
}

// Validate that target language ≠ original language
function validateTranslationLanguage() {
    const errEl = document.getElementById('translationLangError');
    if (!errEl) return true;

    const targetLang = getTargetLanguage().toLowerCase();
    const originalLang = (translationOriginalLesson?.language || '').toLowerCase();

    if (targetLang && originalLang && targetLang === originalLang) {
        errEl.style.display = 'block';
        return false;
    }
    errEl.style.display = 'none';
    return true;
}

// Handle translation form submission
async function handleTranslationSubmit(e) {
    e.preventDefault();

    // Validate original lesson selected
    const originalId = document.getElementById('translationOriginalId').value;
    if (!originalId) {
        alert('Te rugăm să selectezi cursul original.');
        return;
    }

    // Validate target language
    const targetLanguage = getTargetLanguage();
    if (!targetLanguage) {
        alert('Te rugăm să selectezi sau să introduci limba țintă.');
        return;
    }
    if (!validateTranslationLanguage()) {
        alert('The translation language must be different from the original lesson\'s language.');
        return;
    }

    const loading = document.getElementById('loading');
    loading.classList.add('active');

    try {
        const user = window.API.getUser();
        const content = translationQuill ? translationQuill.root.innerHTML : '';

        const lessonData = {
            title: document.getElementById('translationTitle').value,
            slug: document.getElementById('translationSlug').value || generateSlug(document.getElementById('translationTitle').value),
            description: document.getElementById('translationDescription').value,
            content: content,
            type: 'text',
            isPremium: false,
            language: targetLanguage,
            level: document.getElementById('translationLevel').value,
            tags: [],
            attachments: [],
            creators: [user._id],
            category: document.getElementById('translationCategoryId').value || undefined
        };

        const apiUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/lesson-reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.API.getToken()}`
            },
            body: JSON.stringify({
                lessonData,
                isTranslation: true,
                originalLessonId: originalId,
                targetLanguage
            })
        });

        const result = await response.json();

        if (result.success) {
            alert('Translation submitted for review! Editors can review it from the Review Dashboard.');
            window.location.href = 'lesson-review.html';
        } else {
            alert('Error submitting translation: ' + result.message);
        }
    } catch (error) {
        console.error('Error submitting translation:', error);
        alert('Error submitting translation: ' + error.message);
    } finally {
        loading.classList.remove('active');
    }
}
