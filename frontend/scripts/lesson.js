// Lesson page functionality
let currentLesson = null;
let userRating = 0;

// Sample lesson data (in real app, this would come from API)
const lessonData = {
    1: {
        id: 1,
        title: 'Introduction to Forces',
        description: 'Understanding the basic concepts of forces and their effects on objects in static and dynamic situations.',
        type: 'video',
        rating: 4.8,
        ratingCount: 124,
        creators: ['Dr. Smith', 'Prof. Johnson'],
        editors: ['Editor1'],
        createdAt: '2024-01-15',
        category: 'statics',
        domain: 'mechanics',
        subject: 'physics',
        content: {
            videoUrl: 'https://example.com/video.mp4',
            transcript: 'This is the video transcript...',
            notes: 'Additional notes about forces and their applications...'
        }
    },
    2: {
        id: 2,
        title: 'Equilibrium of Rigid Bodies',
        description: 'Learn about static equilibrium and how forces balance in rigid body systems.',
        type: 'text',
        rating: 4.6,
        ratingCount: 89,
        creators: ['Dr. Wilson'],
        editors: ['Editor2', 'Editor3'],
        createdAt: '2024-01-20',
        category: 'statics',
        domain: 'mechanics',
        subject: 'physics',
        content: {
            text: `
                <h2>Introduction to Equilibrium</h2>
                <p>Static equilibrium occurs when an object is at rest and all forces acting on it are balanced. This fundamental concept is crucial for understanding how structures remain stable.</p>
                
                <h3>Conditions for Equilibrium</h3>
                <p>For a rigid body to be in static equilibrium, two conditions must be satisfied:</p>
                <ol>
                    <li><strong>Force Equilibrium:</strong> The sum of all forces acting on the body must equal zero.</li>
                    <li><strong>Moment Equilibrium:</strong> The sum of all moments (torques) about any point must equal zero.</li>
                </ol>
                
                <h3>Mathematical Representation</h3>
                <p>These conditions can be expressed mathematically as:</p>
                <ul>
                    <li>ΣF<sub>x</sub> = 0 (sum of forces in x-direction)</li>
                    <li>ΣF<sub>y</sub> = 0 (sum of forces in y-direction)</li>
                    <li>ΣM = 0 (sum of moments about any point)</li>
                </ul>
                
                <h3>Applications</h3>
                <p>Understanding equilibrium is essential for:</p>
                <ul>
                    <li>Structural engineering and building design</li>
                    <li>Bridge construction and analysis</li>
                    <li>Mechanical system design</li>
                    <li>Safety analysis of structures</li>
                </ul>
            `
        }
    }
};

// Initialize lesson page
document.addEventListener('DOMContentLoaded', async function() {
    await initializeLessonPage();
    setupLessonEventListeners();
});

async function initializeLessonPage() {
    // Get lesson ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const lessonId = urlParams.get('id');
    
    if (!lessonId) {
        showError('No lesson ID provided');
        return;
    }
    
    // Load lesson data from API
    try {
        const apiUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/lessons/${lessonId}`);
        const data = await response.json();
        
        if (!data.success || !data.data) {
            showError('Lesson not found');
            return;
        }
        
        currentLesson = data.data;
        
        // Store full objects for breadcrumb
        currentLesson.id = currentLesson._id;
        currentLesson.subjectSlug = currentLesson.category?.domain?.subject?.slug || 'unknown';
        currentLesson.subjectName = currentLesson.category?.domain?.subject?.name || 'Unknown';
        currentLesson.domainSlug = currentLesson.category?.domain?.slug || 'unknown';
        currentLesson.domainName = currentLesson.category?.domain?.name || 'Unknown';
        currentLesson.categorySlug = currentLesson.category?.slug || 'unknown';
        currentLesson.categoryName = currentLesson.category?.name || 'Unknown';
        
        // Update page content
        updateLessonHeader();
        updateBreadcrumb();
        loadLessonContent();
        loadRelatedLessons();
        
        // Update page title
        document.title = `${currentLesson.title} - EduPlatform`;
        
    } catch (error) {
        console.error('Error loading lesson:', error);
        showError('Error loading lesson');
    }
}

function setupLessonEventListeners() {
    // Start lesson button
    const startLessonBtn = document.getElementById('startLessonBtn');
    if (startLessonBtn) {
        startLessonBtn.addEventListener('click', startLesson);
    }
    
    // Bookmark button
    const bookmarkBtn = document.getElementById('bookmarkBtn');
    if (bookmarkBtn) {
        bookmarkBtn.addEventListener('click', toggleBookmark);
    }
    
    // Rating stars
    setupRatingSystem();
    
    // Edit lesson functionality for creators/editors
    setupEditFunctionality();
}

function updateLessonHeader() {
    if (!currentLesson) return;
    
    // Update type badge
    const typeBadge = document.getElementById('lessonTypeBadge');
    if (typeBadge) {
        const typeIcon = window.EduPlatform.getTypeIcon(currentLesson.type);
        typeBadge.className = `lesson-type-badge ${currentLesson.type}`;
        typeBadge.innerHTML = `
            <i class="${typeIcon}"></i>
            ${window.EduPlatform.capitalizeFirst(currentLesson.type)} Lesson
        `;
    }
    
    // Update title and description
    const titleElement = document.getElementById('lessonTitle');
    const descriptionElement = document.getElementById('lessonDescription');
    
    if (titleElement) titleElement.textContent = currentLesson.title;
    if (descriptionElement) descriptionElement.textContent = currentLesson.description;
    
    // Update rating
    const starsElement = document.getElementById('lessonStars');
    const ratingValueElement = document.getElementById('ratingValue');
    const rating = currentLesson.averageRating || currentLesson.rating || 0;
    
    if (starsElement) {
        starsElement.innerHTML = window.EduPlatform.createStarRating(rating);
    }
    if (ratingValueElement) {
        ratingValueElement.textContent = rating.toFixed(1);
    }
    
    // Update rating count
    const ratingCountElement = document.querySelector('.rating-count');
    if (ratingCountElement) {
        const count = currentLesson.totalRatings || currentLesson.ratingCount || 0;
        ratingCountElement.textContent = `(${count} ratings)`;
    }
    
    // Update creators and editors
    const creatorsElement = document.getElementById('lessonCreators');
    const editorsElement = document.getElementById('lessonEditors');
    const dateElement = document.getElementById('lessonDate');
    
    // Handle creators (can be array of objects or strings)
    if (creatorsElement) {
        let creatorsText = 'Unknown';
        if (currentLesson.creators && currentLesson.creators.length > 0) {
            if (typeof currentLesson.creators[0] === 'object') {
                creatorsText = currentLesson.creators.map(c => c.username || c.firstName || 'Unknown').join(', ');
            } else {
                creatorsText = currentLesson.creators.join(', ');
            }
        }
        creatorsElement.textContent = creatorsText;
    }
    
    // Handle editors
    if (editorsElement) {
        let editorsText = 'None';
        if (currentLesson.editors && currentLesson.editors.length > 0) {
            if (typeof currentLesson.editors[0] === 'object') {
                editorsText = currentLesson.editors.map(e => e.username || e.firstName || 'Unknown').join(', ');
            } else {
                editorsText = currentLesson.editors.join(', ');
            }
        }
        editorsElement.textContent = editorsText;
    }
    
    if (dateElement) dateElement.textContent = window.EduPlatform.formatDate(currentLesson.createdAt);
    
    // Update bookmark button state
    updateBookmarkButton();
}

function updateBreadcrumb() {
    const breadcrumb = document.getElementById('breadcrumb');
    if (!breadcrumb || !currentLesson) return;
    
    breadcrumb.innerHTML = `
        <a href="index.html" class="breadcrumb-item">Home</a>
        <span class="breadcrumb-separator">/</span>
        <a href="subject.html?subject=${currentLesson.subjectSlug}" class="breadcrumb-item">${currentLesson.subjectName}</a>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-item">${currentLesson.domainName}</span>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-item">${currentLesson.categoryName}</span>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-item active">${currentLesson.title}</span>
    `;
}

function loadLessonContent() {
    const contentElement = document.getElementById('lessonContent');
    if (!contentElement || !currentLesson) return;
    
    let html = '';
    
    // Content from API is stored directly in currentLesson.content as HTML
    if (currentLesson.content) {
        html += `
            <div class="lesson-content-wrapper">
                ${currentLesson.content}
            </div>
        `;
    } else {
        html += '<p style="text-align: center; color: #999; padding: 40px;">No content available for this lesson.</p>';
    }
    
    // Add attachments if they exist
    if (currentLesson.attachments && currentLesson.attachments.length > 0) {
        html += `
            <div class="lesson-attachments" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
                <h4 style="margin-bottom: 15px; color: #333; font-size: 16px;">
                    <i class="fas fa-paperclip"></i> Attachments
                </h4>
                <div class="attachments-grid" style="display: grid; gap: 10px;">
                    ${currentLesson.attachments.map(att => createAttachmentHTML(att)).join('')}
                </div>
            </div>
        `;
    }
    
    contentElement.innerHTML = html;
}

function createAttachmentHTML(attachment) {
    const icon = getAttachmentIcon(attachment.type);
    const color = getAttachmentColor(attachment.type);
    const domain = getDomainFromUrl(attachment.url);
    
    return `
        <a href="${attachment.url}" target="_blank" class="attachment-link" style="
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 15px;
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            text-decoration: none;
            color: inherit;
            transition: all 0.2s;
        " onmouseover="this.style.borderColor='#007bff'; this.style.backgroundColor='#e7f3ff';" 
           onmouseout="this.style.borderColor='#e9ecef'; this.style.backgroundColor='#f8f9fa';">
            <div style="
                width: 36px;
                height: 36px;
                background: ${color};
                color: white;
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
            ">
                <i class="${icon}"></i>
            </div>
            <div style="flex: 1;">
                <div style="font-weight: 500; color: #333; margin-bottom: 2px;">${attachment.name}</div>
                <small style="color: #6c757d;">${attachment.type.charAt(0).toUpperCase() + attachment.type.slice(1)} • ${domain}</small>
            </div>
            <i class="fas fa-external-link-alt" style="color: #6c757d; font-size: 14px;"></i>
        </a>
    `;
}

// Helper functions for attachments (same as in create-content.js)
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

function loadVideoContent(container) {
    // This function is kept for backward compatibility but not used with API data
    container.innerHTML = `
        <div class="video-content">
            ${currentLesson.content || '<p>Video content not available</p>'}
        </div>
    `;
}

function loadTextContent(container) {
    // This function is kept for backward compatibility but not used with API data
    container.innerHTML = `
        <div class="text-content">
            ${currentLesson.content || '<p>Text content not available</p>'}
        </div>
    `;
}

function loadAudioContent(container) {
    container.innerHTML = `
        <div class="audio-content">
            <audio class="audio-player" controls>
                <source src="${currentLesson.content.audioUrl}" type="audio/mpeg">
                Your browser does not support the audio element.
            </audio>
            <div class="audio-controls">
                <button class="btn btn-secondary">
                    <i class="fas fa-download"></i>
                    Download Audio
                </button>
            </div>
            <div class="audio-transcript">
                <h3>Transcript</h3>
                <p>${currentLesson.content.transcript || 'Transcript not available.'}</p>
            </div>
        </div>
    `;
}

function loadPresentationContent(container) {
    container.innerHTML = `
        <div class="presentation-content">
            <div class="presentation-viewer">
                <i class="fas fa-presentation" style="font-size: 48px; margin-right: 12px;"></i>
                Presentation Viewer
            </div>
            <div class="presentation-controls">
                <button class="btn btn-secondary">
                    <i class="fas fa-expand"></i>
                    Fullscreen
                </button>
                <button class="btn btn-secondary">
                    <i class="fas fa-download"></i>
                    Download
                </button>
            </div>
        </div>
    `;
}

function loadRelatedLessons() {
    const relatedGrid = document.getElementById('relatedLessonsGrid');
    if (!relatedGrid || !currentLesson) return;
    
    // Filter lessons from the same category (excluding current lesson)
    const relatedLessons = Object.values(lessonData).filter(lesson => 
        lesson.id !== currentLesson.id && 
        lesson.category === currentLesson.category
    );
    
    if (relatedLessons.length === 0) {
        relatedGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #6c757d;">No related lessons found.</p>';
        return;
    }
    
    relatedGrid.innerHTML = '';
    relatedLessons.forEach(lesson => {
        const card = document.createElement('div');
        card.className = 'related-lesson-card';
        card.onclick = () => window.location.href = `lesson.html?id=${lesson.id}`;
        
        card.innerHTML = `
            <div class="lesson-type">${window.EduPlatform.capitalizeFirst(lesson.type)}</div>
            <div class="lesson-title">${lesson.title}</div>
            <div class="lesson-rating">
                <i class="fas fa-star" style="color: #ffc107;"></i>
                ${lesson.rating} (${lesson.ratingCount} ratings)
            </div>
        `;
        
        relatedGrid.appendChild(card);
    });
}

function setupRatingSystem() {
    const ratingStars = document.querySelectorAll('.rating-stars i');
    const submitRatingBtn = document.getElementById('submitRatingBtn');
    
    ratingStars.forEach((star, index) => {
        star.addEventListener('mouseenter', function() {
            highlightStars(index + 1);
        });
        
        star.addEventListener('click', function() {
            userRating = index + 1;
            setUserRating(userRating);
            if (submitRatingBtn) {
                submitRatingBtn.style.display = 'inline-block';
            }
        });
    });
    
    const ratingContainer = document.querySelector('.rating-stars');
    if (ratingContainer) {
        ratingContainer.addEventListener('mouseleave', function() {
            if (userRating > 0) {
                setUserRating(userRating);
            } else {
                clearStars();
            }
        });
    }
    
    if (submitRatingBtn) {
        submitRatingBtn.addEventListener('click', submitRating);
    }
}

function highlightStars(rating) {
    const stars = document.querySelectorAll('.rating-stars i');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.className = 'fas fa-star active';
        } else {
            star.className = 'far fa-star';
        }
    });
}

function setUserRating(rating) {
    highlightStars(rating);
}

function clearStars() {
    const stars = document.querySelectorAll('.rating-stars i');
    stars.forEach(star => {
        star.className = 'far fa-star';
    });
}

async function submitRating() {
    if (userRating === 0) return;
    
    const user = window.API.getUser();
    if (!user) {
        alert('Please login to rate this lesson');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const response = await window.API.lessons.rate(currentLesson._id, userRating);
        
        if (response.success) {
            alert(`Thank you for rating this lesson ${userRating} stars!`);
            
            // Update displayed rating
            currentLesson.averageRating = response.data.averageRating;
            currentLesson.totalRatings = response.data.totalRatings;
            
            const ratingValueElement = document.getElementById('ratingValue');
            const ratingCountElement = document.querySelector('.rating-count');
            const starsElement = document.getElementById('lessonStars');
            
            if (ratingValueElement) ratingValueElement.textContent = response.data.averageRating.toFixed(1);
            if (ratingCountElement) ratingCountElement.textContent = `(${response.data.totalRatings} ratings)`;
            if (starsElement) starsElement.innerHTML = window.EduPlatform.createStarRating(response.data.averageRating);
            
            const submitRatingBtn = document.getElementById('submitRatingBtn');
            if (submitRatingBtn) {
                submitRatingBtn.style.display = 'none';
            }
            
            // Disable further rating
            const ratingStars = document.querySelectorAll('.rating-stars i');
            ratingStars.forEach(star => {
                star.style.pointerEvents = 'none';
                star.style.opacity = '0.7';
            });
        } else {
            alert('Error submitting rating: ' + response.message);
        }
    } catch (error) {
        console.error('Error submitting rating:', error);
        alert('Error submitting rating. Please try again.');
    }
}

function startLesson() {
    // Simulate starting the lesson
    alert('Lesson started! In a real application, this would begin the lesson content.');
    
    // Update button text
    const startBtn = document.getElementById('startLessonBtn');
    if (startBtn) {
        startBtn.innerHTML = '<i class="fas fa-check"></i> Lesson Started';
        startBtn.disabled = true;
        startBtn.style.opacity = '0.7';
    }
}

async function updateBookmarkButton() {
    const user = window.API.getUser();
    const bookmarkBtn = document.getElementById('bookmarkBtn');
    
    if (!bookmarkBtn || !user || !currentLesson) return;
    
    try {
        // Get user profile to check bookmarks
        const response = await window.API.users.getProfile();
        if (response.success && response.data.bookmarkedLessons) {
            const isBookmarked = response.data.bookmarkedLessons.some(
                lesson => (lesson._id || lesson) === currentLesson._id
            );
            
            if (isBookmarked) {
                bookmarkBtn.innerHTML = '<i class="fas fa-bookmark"></i> Bookmarked';
                bookmarkBtn.style.background = '#333';
            } else {
                bookmarkBtn.innerHTML = '<i class="far fa-bookmark"></i> Bookmark';
                bookmarkBtn.style.background = '';
            }
        }
    } catch (error) {
        console.error('Error checking bookmark status:', error);
    }
}

async function toggleBookmark() {
    const user = window.API.getUser();
    if (!user) {
        alert('Please login to bookmark lessons');
        window.location.href = 'login.html';
        return;
    }
    
    const bookmarkBtn = document.getElementById('bookmarkBtn');
    if (!bookmarkBtn) return;
    
    const icon = bookmarkBtn.querySelector('i');
    const isBookmarked = icon.classList.contains('fas');
    
    try {
        let response;
        if (isBookmarked) {
            response = await window.API.users.removeBookmark(currentLesson._id);
            if (response.success) {
                bookmarkBtn.innerHTML = '<i class="far fa-bookmark"></i> Bookmark';
                bookmarkBtn.style.background = '';
                alert('Lesson removed from bookmarks');
            }
        } else {
            response = await window.API.users.bookmarkLesson(currentLesson._id);
            if (response.success) {
                bookmarkBtn.innerHTML = '<i class="fas fa-bookmark"></i> Bookmarked';
                bookmarkBtn.style.background = '#333';
                alert('Lesson added to bookmarks');
            }
        }
    } catch (error) {
        console.error('Error toggling bookmark:', error);
        alert('Error updating bookmark. Please try again.');
    }
}

function setupEditFunctionality() {
    const creatorTools = document.getElementById('creatorTools');
    
    if (creatorTools && (window.EduPlatform.currentUser.type === 'creator' || 
                        window.EduPlatform.currentUser.type === 'editor' || 
                        window.EduPlatform.currentUser.type === 'staff')) {
        creatorTools.style.display = 'flex';
        creatorTools.addEventListener('click', function(e) {
            e.preventDefault();
            showEditModal();
        });
    }
}

function showEditModal() {
    const modal = document.getElementById('editLessonModal');
    if (!modal || !currentLesson) return;
    
    // Populate form with current lesson data
    document.getElementById('editTitle').value = currentLesson.title;
    document.getElementById('editDescription').value = currentLesson.description;
    
    // Set content based on lesson type
    let contentText = '';
    if (currentLesson.type === 'text') {
        contentText = currentLesson.content.text;
    } else if (currentLesson.type === 'video') {
        contentText = currentLesson.content.notes || '';
    }
    document.getElementById('editContent').value = contentText;
    
    modal.classList.add('show');
    setupEditModalEventListeners();
}

function hideEditModal() {
    const modal = document.getElementById('editLessonModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function setupEditModalEventListeners() {
    const closeModal = document.getElementById('closeEditModal');
    const cancelBtn = document.getElementById('cancelEditBtn');
    const submitBtn = document.getElementById('submitEditBtn');
    
    if (closeModal) {
        closeModal.addEventListener('click', hideEditModal);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideEditModal);
    }
    
    if (submitBtn) {
        submitBtn.addEventListener('click', handleLessonEdit);
    }
    
    // Close modal when clicking outside
    const modal = document.getElementById('editLessonModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                hideEditModal();
            }
        });
    }
}

function handleLessonEdit() {
    const title = document.getElementById('editTitle').value;
    const description = document.getElementById('editDescription').value;
    const content = document.getElementById('editContent').value;
    
    if (!title.trim() || !description.trim()) {
        alert('Please fill in all required fields.');
        return;
    }
    
    // Simulate edit submission
    const edit = {
        lessonId: currentLesson.id,
        title: title.trim(),
        description: description.trim(),
        content: content.trim(),
        editor: window.EduPlatform.currentUser.username,
        editedAt: new Date().toISOString()
    };
    
    console.log('Lesson edit submitted:', edit);
    alert('Your changes have been submitted for review.');
    
    hideEditModal();
}

function showError(message) {
    const container = document.querySelector('.container');
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #dc3545; margin-bottom: 20px;"></i>
                <h2 style="color: #dc3545; margin-bottom: 16px;">Error</h2>
                <p style="color: #6c757d; font-size: 18px;">${message}</p>
                <a href="index.html" class="btn btn-primary" style="margin-top: 20px;">
                    <i class="fas fa-home"></i> Go Home
                </a>
            </div>
        `;
    }
}
