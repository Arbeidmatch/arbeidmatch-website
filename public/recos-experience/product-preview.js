// Isolated, fictional product demonstration. No credentials, APIs or storage.
// Visual references: ATS theme tokens, sidebar, candidate toolbar and attention band.
const $ = s => document.querySelector(s);
const views = ['overview', 'candidates', 'clients', 'presentations', 'pipeline', 'assistant', 'team', 'messages'];
const titles = ['Overview', 'Candidates', 'Clients', 'Presentations', 'Pipeline', 'AI & support', 'Team', 'Messages'];
const icons = ['O', 'C', 'B', 'P', '>', '*', 'T', 'M'];
const trades = ['Carpenter', 'Welder TIG', 'Concrete worker', 'Painter', 'Warehouse worker', 'CNC operator', 'Roofer', 'Industrial electrician'];
const people = trades.map((trade, i) => ({ id: i + 1, name: 'Candidate ' + String(i + 1).padStart(2, '0'), trade, city: ['Trondheim', 'Bergen', 'Oslo', 'Stavanger'][i % 4], available: i % 3 === 0, stage: i % 4 }));
let view = views.includes(new URLSearchParams(location.search).get('view')) ? new URLSearchParams(location.search).get('view') : 'overview';
let seats = Math.max(1, Math.min(8, Number(new URLSearchParams(location.search).get('seats')) || 3));
let availableOnly = false, thread = 0;
const chip = (text, tone = '') => `<span class="chip ${tone}">${text}</span>`;
const avatar = value => `<span class="avatar">${value}</span>`;
const pageTitle = (title, text, action = '') => `<div class="page-title"><div><div class="kicker">YOUR WORKSPACE / DEMONSTRATION</div><h1>${title}</h1><p>${text}</p></div>${action}</div>`;
const metric = (label, number, note) => `<div class="metric"><span>${label}</span><strong>${number}</strong><small>${note}</small></div>`;
function overview() {
 return pageTitle('A clear start to your day.', 'Your people, opportunities and next steps. All in one place.', '<button class="primary" data-view="candidates">Explore candidates ↗</button>') +
 `<div class="metrics">${metric('Candidates', '8', 'Your own talent network')}${metric('Active opportunities', '4', 'Across your workspace')}${metric('Conversations', '3', 'Keep relationships moving')}${metric('Recruiter seats', seats, seats === 1 ? 'Start with your own place' : 'Room for your people')}</div>
 <div class="columns"><section class="panel"><div class="panel-head"><h2>Needs attention</h2><span class="chip">Today</span></div>
 <div class="list-row"><span class="dot"></span><div class="grow"><strong>Review a candidate profile</strong><small>Skills and availability ready to explore</small></div><button data-profile="1">Review</button></div>
 <div class="list-row"><span class="dot"></span><div class="grow"><strong>Continue a conversation</strong><small>An example discussion about a project</small></div><button data-view="messages">Open</button></div>
 <div class="list-row"><span class="dot"></span><div class="grow"><strong>Move an application forward</strong><small>See the next stage in the recruitment journey</small></div><button data-view="pipeline">Review</button></div></section>
 <section class="panel"><div class="panel-head"><h2>Workspace activity</h2><span class="chip">Example week</span></div><div class="mini-chart">${[36, 60, 44, 82, 65, 92, 73].map(n => `<i style="height:${n}%"></i>`).join('')}</div><div class="chart-labels">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => `<span>${d}</span>`).join('')}</div></section></div>
 <section class="panel" style="margin-top:24px"><div class="panel-head"><h2>Your candidates</h2><button data-view="candidates">View all ↗</button></div>${people.slice(0, 3).map(p => `<div class="list-row">${avatar(String(p.id).padStart(2, '0'))}<div class="grow"><strong>${p.name}</strong><small>${p.trade} / ${p.city}</small></div>${chip(p.available ? 'Available' : 'To be discussed', p.available ? 'green' : '')}<button data-profile="${p.id}">Open profile ↗</button></div>`).join('')}</section>`;
}
function candidates() {
 return pageTitle('Candidates', 'A connected home for your own recruitment relationships.', '<button class="primary" data-profile="1">Preview a profile ↗</button>') +
 `<div class="toolbar"><input id="candidate-search" aria-label="Search demo candidates" placeholder="Search candidates or trades"><button id="available-filter" class="${availableOnly ? 'active' : ''}" aria-pressed="${availableOnly}">Available now</button><span class="result" id="candidate-count">8 candidates</span></div><div class="table-wrap"><table><thead><tr><th>Candidate</th><th>Trade</th><th>Location</th><th>Availability</th><th>Status</th><th></th></tr></thead><tbody id="candidate-rows"></tbody></table></div><div class="table-footer"><span>Illustrative profiles / no real candidate data</span><span>1 - 8</span></div>`;
}
function paintCandidates() {
 const query = ($('#candidate-search')?.value || '').toLowerCase();
 const filtered = people.filter(p => (!availableOnly || p.available) && `${p.name} ${p.trade} ${p.city}`.toLowerCase().includes(query));
 $('#candidate-count').textContent = `${filtered.length} candidates`;
 $('#candidate-rows').innerHTML = filtered.map(p => `<tr><td>${avatar(String(p.id).padStart(2, '0'))}<span><span class="cell-name">${p.name}</span><small>Fictional example profile</small></span></td><td>${p.trade}</td><td>${p.city}</td><td>${chip(p.available ? 'Available now' : 'To be discussed', p.available ? 'green' : '')}</td><td>${chip('Active', 'blue')}</td><td><button data-profile="${p.id}" aria-label="Open ${p.name}">View profile ↗</button></td></tr>`).join('') || '<tr><td colspan="6">No matching demo candidates.</td></tr>';
}
function pipeline() {
 const stages = ['Applied', 'Screening', 'Interview', 'Offer'];
 return pageTitle('Pipeline', 'Keep every application and its next step in view.', '<button class="primary" data-view="candidates">Find a candidate ↗</button>') +
 `<div class="toolbar"><span class="chip">All example opportunities</span><button data-view="messages">Open messages &#8599;</button><span class="result">8 applications / 4 stages</span></div><div class="board">${stages.map((stage, i) => `<section class="lane"><h2>${stage}<span>${people.filter(p => p.stage === i).length}</span></h2>${people.filter(p => p.stage === i).map(p => `<article class="pipeline-card"><div class="candidate">${avatar(String(p.id).padStart(2, '0'))}<strong>${p.name}</strong></div><p>${p.trade}<br>${p.city} / Example project</p>${chip(p.available ? 'Available' : 'In conversation', p.available ? 'green' : '')}<footer>Demo application${i < 3 ? `<button data-move="${p.id}">Next stage ↗</button>` : `<button data-profile="${p.id}">Profile ↗</button>`}</footer></article>`).join('')}</section>`).join('')}</div>`;
}
function messages() {
 const names = ['Candidate 01', 'Example client', 'Demo recruiter'];
 return pageTitle('Messages', 'Keep the conversation connected to the work.') + `<div class="panel messages"><div class="threads">${names.map((name, i) => `<button class="thread ${i === thread ? 'selected' : ''}" data-thread="${i}"><strong>${name}<span class="chip">Demo</span></strong><small>${['Project conversation', 'Staffing requirements', 'Team update'][i]}</small><p>${['Available for a conversation.', 'Let us clarify the brief.', 'The profile is ready to review.'][i]}</p></button>`).join('')}</div><section class="conversation"><h2>${names[thread]}</h2><small>Illustrative conversation / nothing is sent</small><div class="bubbles"><div class="bubble">${['Hello, I would like to hear more about the project and the work involved.', 'We are planning a new project. Could we discuss the skills we need?', 'I have reviewed the example profile. The experience is ready to discuss.'][thread]}</div><div class="bubble out">${['Of course. We can discuss the tasks, location and your availability.', 'Yes. Let us start with the trade, the tasks and your preferred start date.', 'Thank you. I will look at the profile before the next conversation.'][thread]}<small>Example reply</small></div><div class="bubble">${['Tuesday morning works for a conversation.', 'I will prepare the details for our discussion.', 'You can find it in our candidate overview.'][thread]}</div></div><div class="reply"><span>A conversation preview</span><button data-view="candidates">Explore candidate context ↗</button></div></section></div>`;
}
function team() {
 return pageTitle(seats === 1 ? 'Your own place to work.' : 'Room for your people.', 'One shared workspace. An individual place for every recruiter.', '<button class="primary" id="add-demo-seat">Add a demo seat +</button>') +
 `<div class="team-summary">${seats} recruiter ${seats === 1 ? 'seat' : 'seats'} in your workspace<span>Illustrative configuration / maximum 8 in this preview</span></div><div class="members">${Array.from({ length: seats }, (_, i) => `<article class="panel member">${avatar(i === 0 ? 'YO' : 'R' + (i + 1))}<h2>${i === 0 ? 'Your place' : 'Recruiter ' + (i + 1)}</h2><p>${i === 0 ? 'Workspace administrator' : 'Recruiter seat'}</p><small>${i === 0 ? 'Your business. Your workspace.' : 'A connected place in your team.'}</small>${chip(i === 0 ? 'Administrator' : 'Recruiter', i === 0 ? '' : 'green')}</article>`).join('')}</div>`;
}
function clients() {
 return pageTitle('Your clients. Your relationships.', 'Contacts, requests and next steps in one place.', '<button class="primary" data-view="presentations">Explore presentations &#8599;</button>') +
 '<div class="metrics">' + metric('Client relationships', '3', 'Illustrative companies') + metric('Open requests', '2', 'Know what each client needs') + metric('Presentations', '2', 'Ready for a conversation') + metric('Next steps', '3', 'Keep the relationship moving') + '</div>' +
 '<div class="panel"><div class="panel-head"><h2>Client overview</h2><span class="chip">Fictional examples</span></div>' + ['Example client A', 'Example client B', 'Example client C'].map((name, i) => '<div class="list-row">' + avatar('0' + (i + 1)) + '<div class="grow"><strong>' + name + '</strong><small>' + ['Construction / Clarify the brief', 'Industry / Review the shortlist', 'Logistics / Plan the next conversation'][i] + '</small></div>' + chip(i === 1 ? 'Presentation ready' : 'Follow-up') + '<button data-client="' + i + '">View relationship &#8599;</button></div>').join('') + '</div>';
}
function presentations() {
 return pageTitle('Make your shortlist clear.', 'Give clients a focused presentation they can review.', '<button class="primary" data-presentation="1">Preview client view &#8599;</button>') +
 '<div class="presentation-layout"><section class="panel"><div class="panel-head"><h2>Candidate presentation</h2>' + chip('Example client A') + '</div><div class="presentation-intro"><span class="kicker">A CLEARER CLIENT CONVERSATION</span><h2>The people behind<br>your next project.</h2><p>Bring relevant experience, availability and the next step into a presentation.</p></div>' + people.slice(0, 2).map(person => '<div class="list-row">' + avatar('0' + person.id) + '<div class="grow"><strong>' + person.name + '</strong><small>' + person.trade + ' / Fictional profile</small></div><button data-profile="' + person.id + '">Profile &#8599;</button></div>').join('') + '</section><section class="panel presentation-side"><span class="kicker">WORKSPACE PRESENTATIONS</span><h2>One place for the story.</h2><p>Candidate shortlists for clients. Company introductions for new relationships.</p><div class="profile-row">Candidate presentation ' + chip('Preview ready') + '</div><div class="profile-row">Company introduction ' + chip('Example draft') + '</div><button data-presentation="1">Open presentation preview &#8599;</button></section></div>';
}
function assistant() {
 return pageTitle('A dedicated AI assistant.', 'Find context. Prepare the next step. Keep control.') +
 '<div class="assistant-layout"><section class="panel assistant-panel"><span class="kicker">YOUR WORKSPACE ASSISTANT</span><h2>What would you like<br>to move forward?</h2><p>Choose an example to see how assistance can fit your day.</p><div class="assistant-prompts"><button data-assist="summary">Summarize candidate context &#8599;</button><button data-assist="followup">Prepare a client follow-up &#8599;</button><button data-assist="presentation">Help prepare a presentation &#8599;</button></div><div class="assistant-answer" id="assistant-answer" aria-live="polite">Illustrative responses only. No live AI or messages are sent from this preview.</div></section><section class="panel support-panel"><span class="kicker">WHEN YOU NEED A HAND</span><strong class="support-hours">24/7</strong><h2>AI assistance.<br>Human support.</h2><p>Help using your workspace and moving your work forward, around the clock.</p><button data-support="true">Explore support &#8599;</button></section></div>';
}
function notifyParent() { if (parent !== window) parent.postMessage({ type: 'recos-preview', view, seats }, location.origin); }
function show(next) {
 if (!views.includes(next)) return; view = next;
 history.replaceState(null, '', `?view=${view}&seats=${seats}`);
 document.body.dataset.view = view; document.body.dataset.seats = seats;
 $('nav').innerHTML = views.filter(v => v !== 'messages').map((v, i) => `<button data-view="${v}" ${v === view ? 'aria-current="page"' : ''}><span>${icons[i]}</span>${titles[i]}</button>`).join('');
 $('#breadcrumb').textContent = 'Workspace / ' + titles[views.indexOf(view)];
 $('#view-content').innerHTML = ({ overview, candidates, clients, presentations, pipeline, messages, assistant, team })[view]();
 $('#demo-feedback').textContent = ''; if (view === 'candidates') paintCandidates();
 if ($('#candidate-search')) $('#candidate-search').oninput = paintCandidates;
 if ($('#available-filter')) $('#available-filter').onclick = () => { availableOnly = !availableOnly; $('#available-filter').classList.toggle('active', availableOnly); $('#available-filter').setAttribute('aria-pressed', availableOnly); paintCandidates(); };
 notifyParent();
}
document.addEventListener('click', event => {
 const b = event.target.closest('button'); if (!b) return;
 if (b.dataset.view) show(b.dataset.view);
 if (b.dataset.client !== undefined) {
  $('#profile-content').innerHTML = '<div class="kicker">FICTIONAL CLIENT RELATIONSHIP</div><h2>Example client ' + ['A','B','C'][Number(b.dataset.client)] + '</h2><p>Keep the brief, candidate presentation and next conversation connected.</p><div class="profile-row"><span>Current request</span>Example staffing brief</div><div class="profile-row"><span>Next step</span>Discuss requirements</div><p>Illustrative information only. No real company or contact data.</p>'; $('#candidate-detail').showModal();
 }
 if (b.dataset.presentation) {
  $('#profile-content').innerHTML = '<div class="kicker">FICTIONAL CLIENT PRESENTATION</div><h2>A focused shortlist.</h2><p>Example client A / Example project</p><div class="profile-row"><span>Candidate 01</span>Carpenter</div><div class="profile-row"><span>Candidate 02</span>Welder TIG</div><p>A clear starting point for the next client conversation. No presentation is shared by this demo.</p>'; $('#candidate-detail').showModal();
 }
 if (b.dataset.assist) $('#assistant-answer').textContent = ({ summary: 'Example: Candidate 01 has a carpenter profile with availability ready to discuss. Review the profile and confirm the project requirements before the next conversation.', followup: 'Example draft: Thank you for sharing your requirements. Would you like to review the candidate presentation and agree on the next conversation? You review the wording before anything is sent.', presentation: 'Example: Start with the client brief, select relevant profiles, check availability and prepare a focused presentation. Review the content before sharing it.' })[b.dataset.assist];
 if (b.dataset.support) $('#assistant-answer').textContent = 'AI assistance and human support are available 24/7. This demonstration does not open a support request. Join the beta waitlist to express interest in a workspace.';

 if (b.dataset.profile) { const p = people.find(p => p.id === Number(b.dataset.profile)); if (!p) return; $('#profile-content').innerHTML = `${avatar(String(p.id).padStart(2, '0'))}<div class="kicker" style="margin-top:22px">FICTIONAL CANDIDATE PROFILE</div><h2>${p.name}</h2><p>${p.trade} / ${p.city}</p><div class="skills">${chip(p.trade)}${chip('Example skills', 'blue')}</div><div class="profile-row"><span>Availability</span>${p.available ? 'Available now' : 'To be discussed'}</div><div class="profile-row"><span>Status</span>Active</div><div class="profile-row"><span>Documents</span>Preview only</div><p>This profile demonstrates the experience. It does not represent a real person or an available candidate.</p>`; $('#candidate-detail').showModal(); }
 if (b.dataset.move) { const p = people.find(p => p.id === Number(b.dataset.move)); if (p && p.stage < 3) { p.stage++; show('pipeline'); $('#demo-feedback').textContent = p.name + ' moved to ' + ['Applied', 'Screening', 'Interview', 'Offer'][p.stage] + ' in this demo.'; } }
 if (b.dataset.thread) { thread = Number(b.dataset.thread); show('messages'); }
 if (b.id === 'add-demo-seat') { if (seats < 8) { seats++; show('team'); } else $('#demo-feedback').textContent = 'All 8 demo seats are shown.'; }
});
$('.logo').onclick = event => { event.preventDefault(); show('overview'); };
$('#close-profile').onclick = () => $('#candidate-detail').close();
addEventListener('message', event => { if (event.origin !== location.origin || event.source !== parent || event.data?.type !== 'recos-navigate') return; if (Number.isInteger(event.data.seats)) seats = Math.max(1, Math.min(8, event.data.seats)); show(event.data.view); });
show(view);
