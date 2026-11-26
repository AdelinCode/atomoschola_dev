(function () {
    const byId = id => document.getElementById(id);
    const api = window.API.events;
    const types = {
        workshop: 'Workshop', webinar: 'Webinar', conference: 'Conference',
        competition: 'Competition', community: 'Community'
    };
    const formats = { online: 'Online', 'in-person': 'In person', hybrid: 'Hybrid' };
    const statuses = { upcoming: 'Upcoming', ongoing: 'In progress', past: 'Past' };
    const dateTime = new Intl.DateTimeFormat('en', { dateStyle: 'long', timeStyle: 'short' });
    const month = new Intl.DateTimeFormat('en', { month: 'short' });
    const dialog = byId('eventEditor');
    const form = byId('eventForm');
    const fields = form.elements;
    const eventId = new URLSearchParams(window.location.search).get('id');
    let events = [];
    let selectedEvent;
    let saving = false;

    function eventStatus(event, now) {
        if (Date.parse(event.startsAt) > now) return 'upcoming';
        if (Date.parse(event.endsAt) > now) return 'ongoing';
        return 'past';
    }

    function articleUrl(id) {
        return 'events.html?id=' + encodeURIComponent(id);
    }

    function fillList() {
        const now = Date.now();
        const period = byId('eventPeriod').value;
        const category = byId('eventCategory').value;
        const matching = events.map(event => ({ event, status: eventStatus(event, now) }))
            .filter(({ event, status }) => (period === 'all' || status === period) && (category === 'all' || event.type === category))
            .sort((a, b) => {
                if (a.status === 'past' && b.status === 'past') return Date.parse(b.event.startsAt) - Date.parse(a.event.startsAt);
                if (a.status === 'past') return 1;
                if (b.status === 'past') return -1;
                return Date.parse(a.event.startsAt) - Date.parse(b.event.startsAt);
            });

        const list = byId('eventsList');
        const message = byId('eventsListStatus');
        const cards = document.createDocumentFragment();
        for (const { event, status } of matching) {
            const card = byId('eventCard').content.cloneNode(true);
            const date = new Date(event.startsAt);
            const time = card.querySelector('time');
            time.dateTime = event.startsAt;
            time.querySelector('strong').textContent = date.getDate();
            time.querySelector('span').textContent = month.format(date);
            card.querySelector('a').href = articleUrl(event._id);
            card.querySelector('.events-category').textContent = types[event.type];
            card.querySelector('.events-entry-status').textContent = statuses[status];
            card.querySelector('h3').textContent = event.title;
            card.querySelector('.events-entry-summary').textContent = event.summary;
            card.querySelector('.events-entry-meta').textContent = [dateTime.format(date), formats[event.format], event.location].filter(Boolean).join(' · ');
            cards.append(card);
        }
        list.replaceChildren(cards);
        message.textContent = events.length ? 'No events match these filters.' : 'No events have been published yet.';
        message.hidden = matching.length > 0;
    }

    function renderArticle(event) {
        selectedEvent = event;
        document.title = event.title + ' - Atomo Schola Events';
        byId('eventArticleType').textContent = types[event.type];
        byId('eventArticleStatus').textContent = statuses[eventStatus(event, Date.now())];
        byId('eventArticleTitle').textContent = event.title;
        byId('eventArticleSummary').textContent = event.summary;

        const cover = byId('eventArticleCover');
        if (event.coverUrl) {
            cover.addEventListener('error', () => { cover.hidden = true; }, { once: true });
            cover.src = event.coverUrl;
            cover.hidden = false;
        }

        const body = byId('eventArticleBody');
        for (const block of event.article.split(/\r?\n\s*\r?\n|\r?\n(?=## )/)) {
            if (!block.trim()) continue;
            const lines = block.trim().split(/\r?\n/);
            if (lines[0].startsWith('## ')) {
                const heading = document.createElement('h2');
                heading.textContent = lines.shift().slice(3);
                body.append(heading);
            }
            if (lines.length) {
                const paragraph = document.createElement('p');
                paragraph.textContent = lines.join('\n');
                body.append(paragraph);
            }
        }

        const facts = byId('eventFacts');
        const details = [
            ['Starts', dateTime.format(new Date(event.startsAt))],
            ['Ends', dateTime.format(new Date(event.endsAt))],
            ['Time zone', Intl.DateTimeFormat().resolvedOptions().timeZone],
            ['Format', formats[event.format]], ['Location', event.location],
            ['Organizer', event.organizer], ['Capacity', event.capacity]
        ];
        for (const [label, value] of details) {
            if (!value) continue;
            const term = document.createElement('dt');
            const description = document.createElement('dd');
            term.textContent = label;
            description.textContent = value;
            facts.append(term, description);
        }
        if (event.registrationUrl && eventStatus(event, Date.now()) !== 'past') {
            const registration = byId('eventRegistration');
            registration.href = event.registrationUrl;
            registration.hidden = false;
        }
        byId('eventDetailStatus').hidden = true;
        byId('eventArticle').hidden = false;
    }

    function localDateInput(value) {
        const date = new Date(value);
        const localTime = date.getTime() - date.getTimezoneOffset() * 60000;
        return new Date(localTime).toISOString().slice(0, 16);
    }

    function updateLocationRequirement() {
        fields.location.required = fields.format.value !== 'online';
    }

    function openEditor(event) {
        form.reset();
        byId('eventFormError').hidden = true;
        byId('eventEditorTitle').textContent = event ? 'Edit event' : 'New event';
        byId('saveEvent').textContent = event ? 'Save changes' : 'Publish event';
        if (event) {
            for (const input of fields) {
                if (input.name) input.value = event[input.name] ?? '';
            }
            fields.startsAt.value = localDateInput(event.startsAt);
            fields.endsAt.value = localDateInput(event.endsAt);
        }
        updateLocationRequirement();
        dialog.showModal();
    }

    form.addEventListener('submit', async event => {
        event.preventDefault();
        if (saving) return;
        const data = Object.fromEntries(new FormData(form));
        const errorMessage = byId('eventFormError');
        errorMessage.hidden = true;
        byId('saveEvent').disabled = true;
        saving = true;
        try {
            data.startsAt = new Date(data.startsAt).toISOString();
            data.endsAt = new Date(data.endsAt).toISOString();
            data.capacity = data.capacity ? Number(data.capacity) : null;
            const result = await api.save(data, selectedEvent?._id);
            window.location.assign(articleUrl(result.data._id));
        } catch (error) {
            errorMessage.textContent = error.message || 'Could not save the event.';
            errorMessage.hidden = false;
            saving = false;
            byId('saveEvent').disabled = false;
        }
    });

    byId('closeEventEditor').addEventListener('click', () => { if (!saving) dialog.close(); });
    dialog.addEventListener('cancel', event => { if (saving) event.preventDefault(); });
    fields.format.addEventListener('change', updateLocationRequirement);
    byId('createEvent').addEventListener('click', () => openEditor());
    byId('editEvent').addEventListener('click', () => openEditor(selectedEvent));
    byId('eventTimeZone').textContent = 'Times use your local time zone (' + Intl.DateTimeFormat().resolvedOptions().timeZone + ').';
    for (const [value, label] of Object.entries(types)) {
        byId('eventCategory').add(new Option(label, value));
        fields.type.add(new Option(label, value));
    }

    const permissions = window.API.isAuthenticated()
        ? api.permissions().then(result => result.data.canManage).catch(() => false)
        : Promise.resolve(false);

    if (eventId) {
        byId('eventsDirectory').hidden = true;
        byId('eventDetails').hidden = false;
        api.get(eventId).then(result => {
            renderArticle(result.data);
            permissions.then(canManage => { byId('editEvent').hidden = !canManage; });
        }).catch(error => { byId('eventDetailStatus').textContent = error.message; });
    } else {
        permissions.then(canManage => { byId('createEvent').hidden = !canManage; });
        api.list().then(result => {
            events = result.data;
            byId('eventPeriod').addEventListener('change', fillList);
            byId('eventCategory').addEventListener('change', fillList);
            fillList();
        }).catch(error => { byId('eventsListStatus').textContent = error.message; });
    }
})();
