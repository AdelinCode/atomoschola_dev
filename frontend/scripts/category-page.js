// Category page script for STEAM and Humanities pages
document.addEventListener('DOMContentLoaded', async function() {
    let retries = 0;
    while (!window.API && retries < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
    }

    if (!window.API) return;

    loadCategoryData();
    setupSidebarToggle();
});

async function loadCategoryData() {
    const currentPath = window.location.pathname;
    let majorCategory;

    if (currentPath.includes('steam.html') || currentPath.includes('real.html')) {
        majorCategory = 'STEAM';
    } else if (currentPath.includes('humanities.html') || currentPath.includes('uman.html')) {
        majorCategory = 'Humanities';
    } else {
        return;
    }

    const subjectsGrid = document.getElementById('subjectsGrid');
    const sidebarNav = document.getElementById('sidebarNav');

    if (!subjectsGrid) return;

    try {
        const response = await window.API.subjects.getAll({ majorCategory });

        if (response.success && response.data.length > 0) {
            subjectsGrid.innerHTML = '';
            let totalLessonsCount = 0;
            let totalDomainsCount = 0;

            response.data.forEach(subject => {
                let totalLessons = 0;

                if (subject.domains) {
                    totalDomainsCount += subject.domains.length;
                    subject.domains.forEach(domain => {
                        if (domain.categories) {
                            domain.categories.forEach(category => {
                                if (category.lessons) {
                                    totalLessons += category.lessons.length;
                                }
                            });
                        }
                    });
                }

                totalLessonsCount += totalLessons;

                const card = document.createElement('div');
                card.className = 'subject-card';
                card.onclick = () => location.href = `subject.html?subject=${subject.slug}`;

                card.innerHTML = `
                    <div class="subject-icon">
                        <i class="${subject.icon}"></i>
                    </div>
                    <h3>${subject.name}</h3>
                    <p>${subject.description || 'Explore comprehensive lessons and topics'}</p>
                    <div class="subject-stats">
                        <span><i class="fas fa-book"></i> ${totalLessons} Lessons</span>
                        <span><i class="fas fa-layer-group"></i> ${subject.domains ? subject.domains.length : 0} Domains</span>
                    </div>
                `;

                subjectsGrid.appendChild(card);
            });

            const totalLessonsEl = document.getElementById('totalLessons');
            const totalSubjectsEl = document.getElementById('totalSubjects');
            const totalDomainsEl = document.getElementById('totalDomains');

            if (totalLessonsEl) totalLessonsEl.textContent = totalLessonsCount;
            if (totalSubjectsEl) totalSubjectsEl.textContent = response.data.length;
            if (totalDomainsEl) totalDomainsEl.textContent = totalDomainsCount;

            if (sidebarNav) {
                sidebarNav.innerHTML = '';
                response.data.forEach(subject => {
                    const link = document.createElement('a');
                    link.href = `subject.html?subject=${subject.slug}`;
                    link.className = 'sidebar-item';
                    link.innerHTML = `
                        <i class="${subject.icon}"></i>
                        <span>${subject.name}</span>
                    `;
                    sidebarNav.appendChild(link);
                });
            }

        } else {
            subjectsGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666;">No ${majorCategory} subjects available yet.</div>`;
            if (sidebarNav) {
                sidebarNav.innerHTML = `<p style="text-align: center; color: #666; padding: 20px;">No subjects yet</p>`;
            }
        }
    } catch (error) {
        subjectsGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #dc3545;">Error loading subjects. Please try again later.</div>';
    }
}

function setupSidebarToggle() {
    const toggleBtn = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const body = document.body;

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
            body.classList.toggle('sidebar-collapsed');
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
        });

        if (localStorage.getItem('sidebarCollapsed') === 'true') {
            sidebar.classList.add('collapsed');
            body.classList.add('sidebar-collapsed');
        }
    }
}
