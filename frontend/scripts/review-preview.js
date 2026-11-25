(function () {
    const dialog = document.getElementById('submissionPreview');
    const title = document.getElementById('submissionPreviewTitle');
    const details = document.getElementById('submissionPreviewDetails');
    const content = document.getElementById('submissionPreviewContent');
    const attachments = document.getElementById('submissionPreviewAttachments');
    const attachmentList = attachments.querySelector('ul');
    const lessonTags = new Set('a b blockquote br code div em h1 h2 h3 h4 h5 h6 hr i img li ol p pre s span strong sub sup table tbody td th thead tr u ul'.split(' '));

    function webUrl(value) {
        if (typeof value !== 'string' || !value.trim()) return null;
        try {
            const url = new URL(value, document.baseURI);
            return ['https:', 'http:'].includes(url.protocol) ? url : null;
        } catch {
            return null;
        }
    }

    function renderNode(source, target) {
        if (source.nodeType === Node.TEXT_NODE) {
            target.append(source.textContent);
            return;
        }
        if (source.nodeType !== Node.ELEMENT_NODE || source.namespaceURI !== 'http://www.w3.org/1999/xhtml') return;
        const tag = source.localName;

        if (tag === 'iframe') {
            const url = webUrl(source.getAttribute('src'));
            const videoId = url?.pathname.match(/^\/embed\/([\w-]{11})\/?$/)?.[1];
            if (!videoId || !['www.youtube.com', 'www.youtube-nocookie.com', 'youtube.com', 'youtube-nocookie.com'].includes(url.hostname)) return;
            const video = document.createElement('iframe');
            video.src = `https://www.youtube-nocookie.com/embed/${videoId}`;
            video.title = 'Lesson video';
            video.allowFullscreen = true;
            target.append(video);
            return;
        }

        if (!lessonTags.has(tag)) return;
        const element = document.createElement(tag);
        element.className = [...source.classList].filter(name => /^ql-(align|indent|direction|size|font)-[\w-]+$/.test(name)).join(' ');

        if (tag === 'img') {
            const raw = source.getAttribute('src');
            const url = webUrl(raw);
            const inlineImage = /^data:image\/(?:png|jpeg|gif|webp|avif);base64,/i.test(raw);
            if (!url && !inlineImage) return;
            element.src = inlineImage ? raw : url.href;
            element.alt = source.getAttribute('alt') || '';
        } else if (tag === 'a') {
            const url = webUrl(source.getAttribute('href'));
            if (url) {
                element.href = url.href;
                element.target = '_blank';
                element.rel = 'noopener noreferrer';
            }
        }

        const formula = source.classList.contains('ql-formula') && source.getAttribute('data-value');
        if (formula) {
            if (window.katex) window.katex.render(formula, element, { throwOnError: false });
            else element.textContent = formula;
        } else {
            source.childNodes.forEach(child => renderNode(child, element));
        }
        target.append(element);
    }

    function renderLesson({ lessonData: lesson, catalog }) {
        title.textContent = lesson.title || 'Untitled lesson';
        const template = document.createElement('template');
        template.innerHTML = typeof lesson.content === 'string' ? lesson.content : '';
        content.replaceChildren();
        template.content.childNodes.forEach(node => renderNode(node, content));
        if (!content.textContent.trim() && !content.querySelector('iframe, img')) {
            content.textContent = 'No content available for this lesson.';
        }

        for (const attachment of Array.isArray(lesson.attachments) ? lesson.attachments : []) {
            const url = webUrl(attachment?.url);
            if (!url) continue;
            const item = document.createElement('li');
            const link = document.createElement('a');
            link.href = url.href;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = attachment.name || 'Open attachment';
            item.append(link);
            attachmentList.append(item);
        }
        attachments.hidden = !attachmentList.childElementCount;
        document.getElementById('submissionPreviewSubject').textContent = catalog?.subject || 'Unavailable';
        document.getElementById('submissionPreviewDomain').textContent = catalog?.domain || 'Unavailable';
        document.getElementById('submissionPreviewCategory').textContent = catalog?.category || 'Unavailable';
        document.getElementById('submissionPreviewDescription').textContent = lesson.description || 'No description provided.';
        details.hidden = false;
    }

    let request;
    dialog.addEventListener('close', () => {
        if (dialog.open) return;
        request?.abort();
        content.replaceChildren();
    });

    window.previewSubmission = async function (reviewId) {
        request?.abort();
        const controller = new AbortController();
        request = controller;
        title.textContent = 'Lesson preview';
        details.hidden = true;
        content.textContent = 'Loading lesson…';
        attachmentList.replaceChildren();
        attachments.hidden = true;
        dialog.showModal();

        try {
            const response = await fetch(`${API_URL}/lesson-reviews/${encodeURIComponent(reviewId)}`, {
                headers: { Authorization: `Bearer ${window.API.getToken()}` },
                signal: controller.signal
            });
            const result = await response.json();
            if (!response.ok || !result.success || !result.data?.lessonData) throw new Error(result.message || 'Could not load the lesson.');
            if (dialog.open && request === controller) renderLesson(result.data);
        } catch (error) {
            if (dialog.open && request === controller && error.name !== 'AbortError') content.textContent = error.message;
        }
    };
})();
