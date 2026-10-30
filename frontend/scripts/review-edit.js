// Edit a pending lesson without creating a new review or losing its panel/history.
(() => {
    let review = null;
    let editor = null;
    let saving = false;
    let previousFocus = null;
    let previousOverflow = '';
    let initialVideoUrl = '';
    let initialEditorHtml = '';
    const modal = document.getElementById('submissionEditModal');
    const form = document.getElementById('submissionEditForm');
    const error = document.getElementById('submissionEditError');
    const attachmentTypes = ['document', 'spreadsheet', 'presentation', 'pdf', 'image', 'video', 'other'];
    const input = name => document.getElementById(`submission${name}`);

    function closeEditor() {
        if (saving) return;
        modal.hidden = true;
        document.body.style.overflow = previousOverflow;
        review = null;
        previousFocus?.focus();
    }

    function addAttachment(attachment = {}) {
        const row = document.createElement('div');
        row.className = 'review-edit-attachment';
        const fields = [
            ['Name', 'name', 'text', attachment.name || ''],
            ['URL', 'url', 'url', attachment.url || '']
        ];
        for (const [labelText, name, type, value] of fields) {
            const label = document.createElement('label');
            label.textContent = labelText;
            const field = document.createElement('input');
            field.dataset.field = name;
            field.type = type;
            field.required = true;
            field.value = value;
            label.appendChild(field);
            row.appendChild(label);
        }
        const label = document.createElement('label');
        label.textContent = 'Type';
        const select = document.createElement('select');
        select.dataset.field = 'type';
        for (const type of attachmentTypes) {
            select.add(new Option(type.charAt(0).toUpperCase() + type.slice(1), type));
        }
        select.value = attachment.type || 'document';
        label.appendChild(select);
        row.appendChild(label);
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'btn-leave';
        remove.textContent = 'Remove attachment';
        remove.addEventListener('click', () => row.remove());
        row.appendChild(remove);
        input('Attachments').appendChild(row);
    }

    window.editSubmission = async reviewId => {
        if (!modal.hidden) return;
        try {
            const res = await fetch(`${API_URL}/lesson-reviews/${reviewId}`, {
                headers: { Authorization: `Bearer ${window.API.getToken()}` }
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || 'Could not load submission.');
            const candidate = data.data;
            if ((candidate.creator?._id || candidate.creator) !== lrCurrentUser._id) {
                throw new Error('You can only edit your own submissions.');
            }
            if (candidate.status !== 'under_review' || candidate.voteSessions?.some(s => s.status === 'open')) {
                throw new Error('Only submissions under review without an open vote session can be edited.');
            }
            review = candidate;
            const lesson = review.lessonData;
            form.reset();
            error.textContent = '';
            input('Title').value = lesson.title || '';
            input('Slug').value = lesson.slug || '';
            input('Description').value = lesson.description || '';
            input('Language').value = review.isTranslation ? review.targetLanguage : (lesson.language || 'romanian');
            input('Language').readOnly = !!review.isTranslation;
            input('Level').value = lesson.level || 'beginner';
            input('Tags').value = (lesson.tags || []).join(', ');
            input('TextGroup').hidden = lesson.type === 'video';
            input('VideoGroup').hidden = lesson.type !== 'video';
            input('VideoUrl').required = lesson.type === 'video';
            const content = new DOMParser().parseFromString(lesson.content || '', 'text/html');
            initialVideoUrl = content.querySelector('iframe')?.getAttribute('src') || '';
            input('VideoUrl').value = initialVideoUrl;
            input('Attachments').replaceChildren();
            (lesson.attachments || []).forEach(addAttachment);

            previousFocus = document.activeElement;
            previousOverflow = document.body.style.overflow;
            modal.hidden = false;
            document.body.style.overflow = 'hidden';
            if (!editor) {
                editor = new Quill('#submissionEditor', {
                    theme: 'snow',
                    modules: {
                        formula: true,
                        toolbar: [
                            [{ header: [1, 2, 3, 4, 5, 6, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ list: 'ordered' }, { list: 'bullet' }],
                            [{ script: 'sub' }, { script: 'super' }],
                            [{ indent: '-1' }, { indent: '+1' }],
                            [{ color: [] }, { background: [] }],
                            [{ align: [] }],
                            ['link', 'image', 'formula', 'code-block'], ['clean']
                        ]
                    }
                });
            }
            editor.clipboard.dangerouslyPasteHTML(lesson.type === 'video' ? '' : (lesson.content || ''));
            editor.history.clear();
            initialEditorHtml = editor.root.innerHTML;
            input('Title').focus();
        } catch (e) {
            if (!modal.hidden) closeEditor();
            alert(e.message);
        }
    };

    form.addEventListener('submit', async event => {
        event.preventDefault();
        if (!review || saving) return;
        error.textContent = '';
        try {
            let content = review.lessonData.content;
            if (review.lessonData.type === 'video') {
                const videoUrl = input('VideoUrl').value.trim();
                if (videoUrl !== initialVideoUrl || !initialVideoUrl) {
                    const url = new URL(videoUrl);
                    const host = url.hostname.toLowerCase();
                    const youtube = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'];
                    const id = host === 'youtu.be' ? url.pathname.slice(1)
                        : youtube.includes(host) ? (url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1]) : null;
                    if (!id || !/^[\w-]{11}$/.test(id)) throw new Error('Please enter a valid YouTube video URL.');
                    content = `<div class="video-container" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;"><iframe src="https://www.youtube.com/embed/${id}" style="position:absolute;top:0;left:0;width:100%;height:100%;" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
                }
            } else {
                if (!editor.getText().trim() && !editor.root.querySelector('img, .ql-formula')) {
                    throw new Error('Please enter lesson content.');
                }
                // Keep the original HTML when the content itself was not changed.
                if (editor.root.innerHTML !== initialEditorHtml) content = editor.root.innerHTML;
            }
            const lessonData = {
                title: input('Title').value.trim(),
                slug: input('Slug').value.trim(),
                description: input('Description').value.trim(),
                language: input('Language').value.trim().toLowerCase(),
                level: input('Level').value,
                tags: [...new Set(input('Tags').value.split(',').map(tag => tag.trim()).filter(Boolean))],
                content,
                attachments: [...input('Attachments').children].map(row => ({
                    name: row.querySelector('[data-field="name"]').value.trim(),
                    url: row.querySelector('[data-field="url"]').value.trim(),
                    type: row.querySelector('[data-field="type"]').value
                }))
            };
            saving = true;
            input('Save').disabled = true;
            input('Cancel').disabled = true;
            input('Save').textContent = 'Saving...';
            const res = await fetch(`${API_URL}/lesson-reviews/${review._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${window.API.getToken()}` },
                body: JSON.stringify({ lessonData })
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || 'Could not save submission.');
            saving = false;
            closeEditor();
            await loadReviews(currentTab);
        } catch (e) {
            error.textContent = e.message;
        } finally {
            saving = false;
            input('Save').disabled = false;
            input('Cancel').disabled = false;
            input('Save').textContent = 'Save changes';
        }
    });

    input('AddAttachment').addEventListener('click', () => addAttachment());
    input('Cancel').addEventListener('click', closeEditor);
    modal.addEventListener('click', event => { if (event.target === modal) closeEditor(); });
    modal.addEventListener('keydown', event => {
        if (event.key === 'Escape') { event.preventDefault(); closeEditor(); }
        if (event.key === 'Tab') {
            const controls = [...modal.querySelectorAll('input, select, textarea, button, [tabindex="0"]')]
                .filter(element => !element.disabled && element.getClientRects().length);
            const first = controls[0];
            const last = controls[controls.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
    });
})();
