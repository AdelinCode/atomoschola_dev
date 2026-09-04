// Problem Archive
(function () {
    'use strict';

    const API_URL = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
    const PER_PAGE = 18;

    let allProblems = [];
    let filtered = [];
    let currentPage = 1;
    let filtersOpen = true;
    let isStaff = false;
    let editingId = null;

    const state = {
        search: '', subject: 'all', difficulty: 'all', language: 'all',
        olympiad: 'all', olympiadName: '', olympiadYear: '',
        yearFrom: '', yearTo: '', sort: 'newest'
    };

    const diffLabels = { easy: 'Easy', medium: 'Medium', hard: 'Hard', very_hard: 'Very Hard' };
    const diffBadgeClass = { easy: 'badge-diff-easy', medium: 'badge-diff-medium', hard: 'badge-diff-hard', very_hard: 'badge-diff-vhard' };

    const grid = document.getElementById('archiveGrid');
    const countEl = document.getElementById('archiveCount');
    const paginationEl = document.getElementById('archivePagination');
    const activeFiltersEl = document.getElementById('activeFilters');
    const olympiadNameSection = document.getElementById('olympiadNameSection');
    const olympiadYearSection = document.getElementById('olympiadYearSection');

    document.addEventListener('DOMContentLoaded', function () {
        // Delay slightly so main.js finishes setting up window.API user
        setTimeout(() => {
            checkStaffAccess();
            fetchProblems();
            bindControls();
            initFilterToggle();
            initUploadModal();
        }, 50);
    });

    // ── Auth helper ───────────────────────────────────────────────
    function getAuthHeaders() {
        const token = window.API ? window.API.getToken() : localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    }

    function checkStaffAccess() {
        const user = window.API && window.API.getUser ? window.API.getUser() : null;
        isStaff = !!(user && ['staff', 'owner'].includes(user.userType));
        const btn = document.getElementById('addProblemBtn');
        if (btn) btn.style.display = isStaff ? 'flex' : 'none';
    }

    // ── Fetch ─────────────────────────────────────────────────────
    async function fetchProblems() {
        try {
            const res = await fetch(`${API_URL}/problems`);
            const data = await res.json();
            if (!data.success) throw new Error(data.message || 'Failed');
            allProblems = data.data || [];
            populateSubjectChips();
            populateLanguageChips();
            updateStats();
            applyFilters();
        } catch (e) {
            grid.innerHTML = `
                <div class="archive-empty">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Failed to load</h3>
                    <p>Could not fetch problems. Try refreshing the page.</p>
                </div>`;
            countEl.textContent = '';
        }
    }

    function updateStats() {
        document.getElementById('statTotal').textContent = allProblems.length;
        document.getElementById('statSubjects').textContent = new Set(allProblems.map(p => p.subject).filter(Boolean)).size;
    }

    // ── Chips ─────────────────────────────────────────────────────
    function populateSubjectChips() {
        const subjects = [...new Set(allProblems.map(p => p.subject).filter(Boolean))].sort();
        const container = document.getElementById('subjectChips');
        // Remove old dynamic chips, keep "All"
        container.querySelectorAll('.filter-chip:not([data-value="all"])').forEach(c => c.remove());
        subjects.forEach(s => {
            const btn = document.createElement('button');
            btn.className = 'filter-chip';
            btn.dataset.group = 'subject';
            btn.dataset.value = s;
            btn.textContent = s;
            container.appendChild(btn);
        });
        bindChipGroup(container, 'subject');
    }

    function populateLanguageChips() {
        const langs = [...new Set(allProblems.map(p => p.language).filter(Boolean))].sort();
        const container = document.getElementById('languageChips');
        container.querySelectorAll('.filter-chip:not([data-value="all"])').forEach(c => c.remove());
        langs.forEach(l => {
            const btn = document.createElement('button');
            btn.className = 'filter-chip';
            btn.dataset.group = 'language';
            btn.dataset.value = l;
            btn.textContent = l;
            container.appendChild(btn);
        });
        bindChipGroup(container, 'language');
    }

    function bindChipGroup(container, key) {
        // Remove old listener by cloning
        const fresh = container.cloneNode(true);
        container.parentNode.replaceChild(fresh, container);
        fresh.addEventListener('click', function (e) {
            const chip = e.target.closest('.filter-chip');
            if (!chip) return;
            fresh.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            state[key] = chip.dataset.value;
            currentPage = 1;
            applyFilters();
        });
    }

    // ── Controls ──────────────────────────────────────────────────
    function bindControls() {
        document.getElementById('filterSearch').addEventListener('input', debounce(function () {
            state.search = this.value.trim().toLowerCase();
            currentPage = 1; applyFilters();
        }, 300));

        document.querySelectorAll('[data-group="difficulty"]').forEach(btn => {
            btn.addEventListener('click', function () {
                document.querySelectorAll('[data-group="difficulty"]').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                state.difficulty = this.dataset.value;
                currentPage = 1; applyFilters();
            });
        });

        document.querySelectorAll('[data-group="olympiad"]').forEach(chip => {
            chip.addEventListener('click', function () {
                document.querySelectorAll('[data-group="olympiad"]').forEach(c => c.classList.remove('active'));
                this.classList.add('active');
                state.olympiad = this.dataset.value;
                olympiadNameSection.style.display = state.olympiad === 'yes' ? '' : 'none';
                olympiadYearSection.style.display = state.olympiad === 'yes' ? '' : 'none';
                currentPage = 1; applyFilters();
            });
        });

        ['yearFrom', 'yearTo'].forEach(id => {
            document.getElementById(id).addEventListener('input', debounce(function () {
                state[id] = this.value.trim(); currentPage = 1; applyFilters();
            }, 400));
        });

        document.getElementById('filterOlympiadName').addEventListener('input', debounce(function () {
            state.olympiadName = this.value.trim().toLowerCase(); currentPage = 1; applyFilters();
        }, 300));

        document.getElementById('filterOlympiadYear').addEventListener('input', debounce(function () {
            state.olympiadYear = this.value.trim(); currentPage = 1; applyFilters();
        }, 400));

        document.getElementById('sortSelect').addEventListener('change', function () {
            state.sort = this.value; currentPage = 1; applyFilters();
        });

        document.getElementById('resetFiltersBtn').addEventListener('click', resetFilters);

        document.getElementById('filterToggleBtn').addEventListener('click', function () {
            document.getElementById('archiveFilters').classList.toggle('open');
        });
    }

    function initFilterToggle() {
        const header = document.getElementById('filterPanelToggle');
        const body = document.getElementById('filterBody');
        const chevron = document.getElementById('filterChevron');

        header.addEventListener('click', function () {
            filtersOpen = !filtersOpen;
            body.style.display = filtersOpen ? '' : 'none';
            chevron.style.transform = filtersOpen ? '' : 'rotate(180deg)';
        });
    }

    // ── Filters ───────────────────────────────────────────────────
    function applyFilters() {
        let result = allProblems.slice();

        if (state.search) {
            result = result.filter(p =>
                p.title.toLowerCase().includes(state.search) ||
                (p.description || '').toLowerCase().includes(state.search) ||
                (p.tags || []).some(t => t.toLowerCase().includes(state.search))
            );
        }
        if (state.subject !== 'all') result = result.filter(p => p.subject === state.subject);
        if (state.difficulty !== 'all') result = result.filter(p => p.difficulty === state.difficulty);
        if (state.language !== 'all') result = result.filter(p => p.language === state.language);

        if (state.olympiad === 'yes') {
            result = result.filter(p => p.isOlympiad === true);
            if (state.olympiadName) result = result.filter(p => (p.olympiadName || '').toLowerCase().includes(state.olympiadName));
            if (state.olympiadYear) result = result.filter(p => String(p.olympiadYear) === state.olympiadYear);
        } else if (state.olympiad === 'no') {
            result = result.filter(p => !p.isOlympiad);
        }

        if (state.yearFrom) result = result.filter(p => p.year && p.year >= parseInt(state.yearFrom, 10));
        if (state.yearTo) result = result.filter(p => p.year && p.year <= parseInt(state.yearTo, 10));

        switch (state.sort) {
            case 'newest': result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
            case 'oldest': result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); break;
            case 'title': result.sort((a, b) => a.title.localeCompare(b.title)); break;
            case 'year': result.sort((a, b) => (b.year || 0) - (a.year || 0)); break;
        }

        filtered = result;
        renderActiveFilters();
        renderGrid();
        renderPagination();
        updateActiveFilterCount();
    }

    function updateActiveFilterCount() {
        const count = [
            state.search, state.subject !== 'all', state.difficulty !== 'all',
            state.language !== 'all', state.olympiad !== 'all', state.yearFrom, state.yearTo
        ].filter(Boolean).length;
        const el = document.getElementById('activeFilterCount');
        if (el) { el.style.display = count > 0 ? 'inline-flex' : 'none'; el.textContent = count; }
    }

    // ── Grid ──────────────────────────────────────────────────────
    function renderGrid() {
        const start = (currentPage - 1) * PER_PAGE;
        const page = filtered.slice(start, start + PER_PAGE);
        countEl.textContent = `${filtered.length} problem${filtered.length !== 1 ? 's' : ''} found`;

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="archive-empty">
                    <i class="fas fa-search"></i>
                    <h3>No problems found</h3>
                    <p>Try adjusting your filters.</p>
                </div>`;
            return;
        }
        grid.innerHTML = page.map(renderCard).join('');
    }

    function renderCard(problem) {
        const diffClass = diffBadgeClass[problem.difficulty] || '';
        const diffLabel = diffLabels[problem.difficulty] || '';

        const badges = [
            `<span class="problem-badge badge-subject">${escHtml(problem.subject)}</span>`,
            problem.isOlympiad ? `<span class="problem-badge badge-olympiad"><i class="fas fa-trophy"></i> Olympiad</span>` : '',
            diffClass ? `<span class="problem-badge ${diffClass}">${diffLabel}</span>` : ''
        ].filter(Boolean).join('');

        const metaItems = [];
        if (problem.year) metaItems.push(`<span class="problem-meta-item"><i class="fas fa-calendar-alt"></i>${problem.year}</span>`);
        if (problem.isOlympiad && problem.olympiadName) metaItems.push(`<span class="problem-meta-item"><i class="fas fa-award"></i>${escHtml(problem.olympiadName)}</span>`);
        if (problem.isOlympiad && problem.olympiadYear && problem.olympiadYear !== problem.year) {
            metaItems.push(`<span class="problem-meta-item"><i class="fas fa-flag"></i>${problem.olympiadYear}</span>`);
        }

        const fileIcon = { pdf: 'fa-file-pdf', image: 'fa-file-image', document: 'fa-file-word', other: 'fa-file' }[problem.fileType] || 'fa-file';
        const actionHtml = problem.fileUrl
            ? `<a href="${escHtml(problem.fileUrl)}" target="_blank" rel="noopener noreferrer" class="problem-card-link">
                   <i class="fas ${fileIcon}"></i> Open file
               </a>`
            : `<span class="problem-card-link-disabled"><i class="fas fa-file-slash"></i> No file</span>`;

        const staffActions = isStaff ? `
            <div class="problem-card-staff-actions">
                <button class="card-staff-btn card-edit-btn" onclick="event.stopPropagation(); archiveEditProblem('${problem._id}')" title="Edit">
                    <i class="fas fa-pen"></i>
                </button>
                <button class="card-staff-btn card-delete-btn" onclick="event.stopPropagation(); archiveDeleteProblem('${problem._id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>` : '';

        return `
        <div class="problem-card${problem.isOlympiad ? ' is-olympiad' : ''}" data-id="${problem._id}" onclick="archiveOpenProblem('${problem._id}')" style="cursor:pointer;">
            <div class="problem-card-top">
                <div class="problem-card-badges">${badges}</div>
                ${staffActions}
            </div>
            <h3 class="problem-card-title">${escHtml(problem.title)}</h3>
            ${problem.description ? `<p class="problem-card-desc">${escHtml(problem.description)}</p>` : ''}
            ${metaItems.length ? `<div class="problem-card-meta">${metaItems.join('')}</div>` : ''}
            <div class="problem-card-footer">
                <span class="problem-card-lang"><i class="fas fa-language"></i>${escHtml(problem.language || '—')}</span>
                ${actionHtml}
            </div>
        </div>`;
    }

    // ── Edit / Delete (staff) ─────────────────────────────────────
    window.archiveOpenProblem = function (id) {
        window.location.href = `problem.html?id=${id}`;
    };

    window.archiveEditProblem = function (id) {
        const problem = allProblems.find(p => p._id === id);
        if (!problem) return;
        editingId = id;
        openUploadModal(problem);
    };

    window.archiveDeleteProblem = async function (id) {
        if (!confirm('Delete this problem? This cannot be undone.')) return;
        try {
            const res = await fetch(`${API_URL}/problems/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            const data = await res.json();
            if (data.success) {
                allProblems = allProblems.filter(p => p._id !== id);
                updateStats();
                applyFilters();
            } else {
                alert(data.message || 'Delete failed.');
            }
        } catch (e) {
            alert('Network error. Try again.');
        }
    };

    // ── Upload / Edit Modal ───────────────────────────────────────
    function initUploadModal() {
        const overlay = document.getElementById('uploadModalOverlay');
        const addBtn = document.getElementById('addProblemBtn');
        const closeBtn = document.getElementById('uploadModalClose');
        const cancelBtn = document.getElementById('uploadCancelBtn');
        const submitBtn = document.getElementById('uploadSubmitBtn');
        const olympiadCheck = document.getElementById('upIsOlympiad');

        if (addBtn) addBtn.addEventListener('click', () => { editingId = null; openUploadModal(null); });
        if (closeBtn) closeBtn.addEventListener('click', closeUploadModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeUploadModal);
        overlay.addEventListener('click', e => { if (e.target === overlay) closeUploadModal(); });

        if (olympiadCheck) {
            olympiadCheck.addEventListener('change', function () {
                document.getElementById('upOlympiadFields').style.display = this.checked ? '' : 'none';
            });
        }

        if (submitBtn) submitBtn.addEventListener('click', submitProblem);
    }

    function openUploadModal(problem) {
        const overlay = document.getElementById('uploadModalOverlay');
        const title = document.getElementById('uploadModalTitle');
        const submitBtn = document.getElementById('uploadSubmitBtn');

        if (problem) {
            // Edit mode — populate fields
            if (title) title.textContent = 'Edit Problem';
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
            document.getElementById('upTitle').value = problem.title || '';
            document.getElementById('upDesc').value = problem.description || '';
            document.getElementById('upSubject').value = problem.subject || '';
            document.getElementById('upLanguage').value = problem.language || '';
            document.getElementById('upDifficulty').value = problem.difficulty || '';
            document.getElementById('upYear').value = problem.year || '';
            document.getElementById('upFileUrl').value = problem.fileUrl || '';
            document.getElementById('upFileType').value = problem.fileType || 'pdf';
            const check = document.getElementById('upIsOlympiad');
            check.checked = !!problem.isOlympiad;
            document.getElementById('upOlympiadFields').style.display = problem.isOlympiad ? '' : 'none';
            document.getElementById('upOlympiadName').value = problem.olympiadName || '';
            document.getElementById('upOlympiadYear').value = problem.olympiadYear || '';
        } else {
            // Add mode
            if (title) title.textContent = 'Add Problem';
            submitBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Problem';
            clearUploadForm();
        }

        const err = document.getElementById('uploadError');
        if (err) err.style.display = 'none';
        overlay.style.display = 'flex';
    }

    function closeUploadModal() {
        document.getElementById('uploadModalOverlay').style.display = 'none';
        editingId = null;
    }

    function clearUploadForm() {
        ['upTitle', 'upDesc', 'upSubject', 'upYear', 'upOlympiadName', 'upOlympiadYear', 'upFileUrl'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        ['upLanguage', 'upDifficulty', 'upFileType'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.selectedIndex = 0;
        });
        document.getElementById('upIsOlympiad').checked = false;
        document.getElementById('upOlympiadFields').style.display = 'none';
    }

    async function submitProblem() {
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
            subject,
            difficulty,
            language,
            year: parseInt(document.getElementById('upYear').value) || null,
            isOlympiad,
            olympiadName: isOlympiad ? (document.getElementById('upOlympiadName').value.trim() || null) : null,
            olympiadYear: isOlympiad ? (parseInt(document.getElementById('upOlympiadYear').value) || null) : null,
            fileUrl: document.getElementById('upFileUrl').value.trim() || null,
            fileType: document.getElementById('upFileType').value
        };

        const submitBtn = document.getElementById('uploadSubmitBtn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        const isEdit = !!editingId;
        const url = isEdit ? `${API_URL}/problems/${editingId}` : `${API_URL}/problems`;
        const method = isEdit ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.success) {
                closeUploadModal();
                if (isEdit) {
                    const idx = allProblems.findIndex(p => p._id === editingId);
                    if (idx !== -1) allProblems[idx] = data.data;
                } else {
                    allProblems.unshift(data.data);
                }
                updateStats();
                populateSubjectChips();
                populateLanguageChips();
                applyFilters();
            } else {
                errEl.textContent = data.message || 'Operation failed.';
                errEl.style.display = 'block';
            }
        } catch (e) {
            errEl.textContent = 'Network error. Try again.';
            errEl.style.display = 'block';
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = isEdit
                ? '<i class="fas fa-save"></i> Save Changes'
                : '<i class="fas fa-upload"></i> Upload Problem';
        }
    }

    // ── Active filter tags ─────────────────────────────────────────
    function renderActiveFilters() {
        const tags = [];
        if (state.search) tags.push({ label: `"${state.search}"`, clear: () => { state.search = ''; document.getElementById('filterSearch').value = ''; } });
        if (state.subject !== 'all') tags.push({ label: state.subject, clear: () => { state.subject = 'all'; setChipActive('subjectChips', 'all'); } });
        if (state.difficulty !== 'all') tags.push({ label: diffLabels[state.difficulty], clear: () => { state.difficulty = 'all'; document.querySelector('[data-group="difficulty"][data-value="all"]').classList.add('active'); document.querySelectorAll('[data-group="difficulty"]:not([data-value="all"])').forEach(c => c.classList.remove('active')); } });
        if (state.language !== 'all') tags.push({ label: state.language, clear: () => { state.language = 'all'; setChipActive('languageChips', 'all'); } });
        if (state.olympiad !== 'all') tags.push({ label: state.olympiad === 'yes' ? 'Olympiad' : 'Other', clear: () => { state.olympiad = 'all'; document.querySelector('[data-group="olympiad"][data-value="all"]').click(); } });
        if (state.yearFrom) tags.push({ label: `From ${state.yearFrom}`, clear: () => { state.yearFrom = ''; document.getElementById('yearFrom').value = ''; } });
        if (state.yearTo) tags.push({ label: `To ${state.yearTo}`, clear: () => { state.yearTo = ''; document.getElementById('yearTo').value = ''; } });

        activeFiltersEl.innerHTML = tags.map((t, i) => `
            <span class="active-filter-tag">${escHtml(t.label)}<button onclick="archiveClearFilter(${i})">&times;</button></span>
        `).join('');
        window._archiveFilterClearFns = tags.map(t => t.clear);
    }

    window.archiveClearFilter = function (i) {
        if (window._archiveFilterClearFns && window._archiveFilterClearFns[i]) {
            window._archiveFilterClearFns[i]();
            currentPage = 1;
            applyFilters();
        }
    };

    function setChipActive(containerId, value) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.querySelectorAll('.filter-chip').forEach(c => c.classList.toggle('active', c.dataset.value === value));
    }

    // ── Reset ─────────────────────────────────────────────────────
    function resetFilters() {
        Object.assign(state, { search: '', subject: 'all', difficulty: 'all', language: 'all', olympiad: 'all', olympiadName: '', olympiadYear: '', yearFrom: '', yearTo: '' });
        ['filterSearch', 'yearFrom', 'yearTo', 'filterOlympiadName', 'filterOlympiadYear'].forEach(id => { document.getElementById(id).value = ''; });
        setChipActive('subjectChips', 'all');
        setChipActive('languageChips', 'all');
        document.querySelector('[data-group="difficulty"][data-value="all"]').classList.add('active');
        document.querySelectorAll('[data-group="difficulty"]:not([data-value="all"])').forEach(c => c.classList.remove('active'));
        document.querySelector('[data-group="olympiad"][data-value="all"]').classList.add('active');
        document.querySelectorAll('[data-group="olympiad"]:not([data-value="all"])').forEach(c => c.classList.remove('active'));
        olympiadNameSection.style.display = 'none';
        olympiadYearSection.style.display = 'none';
        currentPage = 1;
        applyFilters();
    }

    // ── Pagination ────────────────────────────────────────────────
    function renderPagination() {
        const total = Math.ceil(filtered.length / PER_PAGE);
        if (total <= 1) { paginationEl.innerHTML = ''; return; }
        let html = `<button class="page-btn" onclick="archiveGoPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>`;
        buildPageRange(currentPage, total).forEach(p => {
            html += p === '...'
                ? `<span class="page-ellipsis">…</span>`
                : `<button class="page-btn${p === currentPage ? ' active' : ''}" onclick="archiveGoPage(${p})">${p}</button>`;
        });
        html += `<button class="page-btn" onclick="archiveGoPage(${currentPage + 1})" ${currentPage === total ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>`;
        paginationEl.innerHTML = html;
    }

    function buildPageRange(cur, total) {
        if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
        const pages = [1];
        if (cur > 3) pages.push('...');
        for (let p = Math.max(2, cur - 1); p <= Math.min(total - 1, cur + 1); p++) pages.push(p);
        if (cur < total - 2) pages.push('...');
        pages.push(total);
        return pages;
    }

    window.archiveGoPage = function (page) {
        const total = Math.ceil(filtered.length / PER_PAGE);
        if (page < 1 || page > total) return;
        currentPage = page;
        renderGrid();
        renderPagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ── Utils ─────────────────────────────────────────────────────
    function escHtml(str) {
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function debounce(fn, ms) {
        let t;
        return function (...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), ms); };
    }
})();
