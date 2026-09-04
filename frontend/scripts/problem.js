// Problem Detail Page
(function () {
    'use strict';

    const API_URL = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';

    const diffLabels = { easy: 'Easy', medium: 'Medium', hard: 'Hard', very_hard: 'Very Hard' };
    const diffBadgeClass = { easy: 'badge-diff-easy', medium: 'badge-diff-medium', hard: 'badge-diff-hard', very_hard: 'badge-diff-vhard' };
    const fileIcons = { pdf: 'fa-file-pdf', image: 'fa-file-image', document: 'fa-file-word', other: 'fa-file' };
    const fileTypeLabels = { pdf: 'PDF', image: 'Image', document: 'Document', other: 'File' };

    let problem = null;
    let isStaff = false;

    document.addEventListener('DOMContentLoaded', function () {
        setTimeout(() => {
            checkStaff();
            loadProblem();
        }, 50);
    });

    function getAuthHeaders() {
        const token = window.API ? window.API.getToken() : localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    }

    function checkStaff() {
        const user = window.API && window.API.getUser ? window.API.getUser() : null;
        isStaff = !!(user && ['staff', 'owner'].includes(user.userType));
    }

    function getProblemId() {
        return new URLSearchParams(window.location.search).get('id');
    }

    async function loadProblem() {
        const id = getProblemId();
        if (!id) { showError(); return; }

        try {
            const res = await fetch(`${API_URL}/problems/${id}`);
            const data = await res.json();
            if (!data.success) { showError(); return; }
            problem = data.data;
            renderProblem(problem);
        } catch (e) {
            showError();
        }
    }

    function showError() {
        document.getElementById('problemLoading').style.display = 'none';
        document.getElementById('problemError').style.display = 'flex';
    }

    function renderProblem(p) {
        document.title = `${p.title} - Atomo Schola`;
        document.getElementById('breadcrumbTitle').textContent = p.title;

        // Badges
        const badges = [
            `<span class="problem-badge badge-subject">${escHtml(p.subject)}</span>`,
            p.isOlympiad ? `<span class="problem-badge badge-olympiad"><i class="fas fa-trophy"></i> Olympiad</span>` : '',
            diffBadgeClass[p.difficulty] ? `<span class="problem-badge ${diffBadgeClass[p.difficulty]}">${diffLabels[p.difficulty]}</span>` : ''
        ].filter(Boolean).join('');
        document.getElementById('detailBadges').innerHTML = badges;

        // Staff actions
        if (isStaff) {
            const actionsEl = document.getElementById('detailStaffActions');
            actionsEl.style.display = 'flex';
            document.getElementById('detailEditBtn').addEventListener('click', openEditModal);
            document.getElementById('detailDeleteBtn').addEventListener('click', deleteProblem);
        }

        // Title
        document.getElementById('detailTitle').textContent = p.title;

        // Meta chips
        const metaItems = [];
        if (p.language) metaItems.push(`<span class="problem-meta-chip"><i class="fas fa-language"></i>${escHtml(p.language)}</span>`);
        if (p.year) metaItems.push(`<span class="problem-meta-chip"><i class="fas fa-calendar-alt"></i>${p.year}</span>`);
        if (p.isOlympiad && p.olympiadName) metaItems.push(`<span class="problem-meta-chip"><i class="fas fa-award"></i>${escHtml(p.olympiadName)}</span>`);
        if (p.isOlympiad && p.olympiadYear) metaItems.push(`<span class="problem-meta-chip"><i class="fas fa-flag"></i>Edition ${p.olympiadYear}</span>`);
        if (p.uploadedBy) metaItems.push(`<span class="problem-meta-chip"><i class="fas fa-user"></i>${escHtml(p.uploadedBy.username)}</span>`);
        if (p.createdAt) {
            const d = new Date(p.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
            metaItems.push(`<span class="problem-meta-chip"><i class="fas fa-clock"></i>${d}</span>`);
        }
        document.getElementById('detailMeta').innerHTML = metaItems.join('');

        // Description
        if (p.description && p.description.trim()) {
            document.getElementById('detailDesc').textContent = p.description;
            document.getElementById('descSection').style.display = '';
        }

        // Tags
        if (p.tags && p.tags.length > 0) {
            document.getElementById('detailTags').innerHTML = p.tags.map(t => `<span class="problem-tag">${escHtml(t)}</span>`).join('');
            document.getElementById('tagsSection').style.display = '';
        }

        // Info grid
        const infoItems = [
            { label: 'Subject', value: p.subject },
            { label: 'Difficulty', value: diffLabels[p.difficulty] || p.difficulty },
            { label: 'Language', value: p.language },
            { label: 'Year', value: p.year || '—' },
            { label: 'Type', value: p.isOlympiad ? 'Olympiad' : 'Other' },
            { label: 'File format', value: fileTypeLabels[p.fileType] || '—' },
        ];
        document.getElementById('detailInfoGrid').innerHTML = infoItems.map(item => `
            <div class="problem-info-item">
                <span class="problem-info-label">${item.label}</span>
                <span class="problem-info-value">${escHtml(String(item.value))}</span>
            </div>
        `).join('');

        // File
        if (p.fileUrl) {
            const iconClass = fileIcons[p.fileType] || 'fa-file';
            document.getElementById('fileIcon').innerHTML = `<i class="fas ${iconClass}"></i>`;
            document.getElementById('fileTypeLabel').textContent = fileTypeLabels[p.fileType] || 'File';
            document.getElementById('fileOpenBtn').href = p.fileUrl;
        } else {
            document.getElementById('fileCard').style.display = 'none';
            document.getElementById('noFileCard').style.display = 'flex';
        }

        // Show page
        document.getElementById('problemLoading').style.display = 'none';
        document.getElementById('problemMain').style.display = '';
    }

    // ── Edit modal ────────────────────────────────────────────────
    function openEditModal() {
        const p = problem;
        document.getElementById('upTitle').value = p.title || '';
        document.getElementById('upDesc').value = p.description || '';
        document.getElementById('upSubject').value = p.subject || '';
        document.getElementById('upLanguage').value = p.language || '';
        document.getElementById('upDifficulty').value = p.difficulty || '';
        document.getElementById('upYear').value = p.year || '';
        document.getElementById('upFileUrl').value = p.fileUrl || '';
        document.getElementById('upFileType').value = p.fileType || 'pdf';
        const check = document.getElementById('upIsOlympiad');
        check.checked = !!p.isOlympiad;
        document.getElementById('upOlympiadFields').style.display = p.isOlympiad ? '' : 'none';
        document.getElementById('upOlympiadName').value = p.olympiadName || '';
        document.getElementById('upOlympiadYear').value = p.olympiadYear || '';
        document.getElementById('uploadError').style.display = 'none';
        document.getElementById('uploadModalOverlay').style.display = 'flex';
    }

    function closeModal() {
        document.getElementById('uploadModalOverlay').style.display = 'none';
    }

    document.getElementById('uploadModalClose').addEventListener('click', closeModal);
    document.getElementById('uploadCancelBtn').addEventListener('click', closeModal);
    document.getElementById('uploadModalOverlay').addEventListener('click', function (e) {
        if (e.target === this) closeModal();
    });

    document.getElementById('upIsOlympiad').addEventListener('change', function () {
        document.getElementById('upOlympiadFields').style.display = this.checked ? '' : 'none';
    });

    document.getElementById('uploadSubmitBtn').addEventListener('click', async function () {
        const errEl = document.getElementById('uploadError');
        errEl.style.display = 'none';

        const title = document.getElementById('upTitle').value.trim();
        const subject = document.getElementById('upSubject').value.trim();
        const difficulty = document.getElementById('upDifficulty').value;
        const language = document.getElementById('upLanguage').value;

        if (!title || !subject || !difficulty || !language) {
            errEl.textContent = 'Title, subject, difficulty and language are required.';
            errEl.style.display = 'block';
            return;
        }

        const isOlympiad = document.getElementById('upIsOlympiad').checked;
        const payload = {
            title,
            description: document.getElementById('upDesc').value.trim(),
            subject, difficulty, language,
            year: parseInt(document.getElementById('upYear').value) || null,
            isOlympiad,
            olympiadName: isOlympiad ? (document.getElementById('upOlympiadName').value.trim() || null) : null,
            olympiadYear: isOlympiad ? (parseInt(document.getElementById('upOlympiadYear').value) || null) : null,
            fileUrl: document.getElementById('upFileUrl').value.trim() || null,
            fileType: document.getElementById('upFileType').value
        };

        const btn = this;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        try {
            const res = await fetch(`${API_URL}/problems/${problem._id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                problem = data.data;
                closeModal();
                renderProblem(problem);
            } else {
                errEl.textContent = data.message || 'Failed to save.';
                errEl.style.display = 'block';
            }
        } catch (e) {
            errEl.textContent = 'Network error. Try again.';
            errEl.style.display = 'block';
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
        }
    });

    // ── Delete ────────────────────────────────────────────────────
    async function deleteProblem() {
        if (!confirm('Delete this problem? This cannot be undone.')) return;
        try {
            const res = await fetch(`${API_URL}/problems/${problem._id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            const data = await res.json();
            if (data.success) {
                window.location.href = 'archive.html';
            } else {
                alert(data.message || 'Delete failed.');
            }
        } catch (e) {
            alert('Network error. Try again.');
        }
    }

    function escHtml(str) {
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
})();
