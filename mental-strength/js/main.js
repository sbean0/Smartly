const resourcesData = [
  {id:'insight-timer',title:'Insight Timer App',desc:'Thousands of free guided meditations.',url:'https://insighttimer.com'},
  {id:'headspace-free',title:'Headspace Free Sessions',desc:'Introductory meditations.',url:'https://www.headspace.com/meditation'},
  {id:'positivepsychology',title:'PositivePsychology.com Free Tools',desc:'Worksheets for gratitude.',url:'https://positivepsychology.com/free-resources/'},
  {id:'ted-resilience',title:'TED Talks on Resilience',desc:'Videos for mental toughness.',url:'https://www.ted.com/topics/resilience'},
  {id:'nimh-guides',title:'NIMH Mental Health Guides',desc:'PDFs on coping strategies.',url:'https://www.nimh.nih.gov/health/topics'},
  {id:'who-mental-health',title:'WHO Mental Health Resources',desc:'Guides on stress management.',url:'https://www.who.int/health-topics/mental-health'},
  {id:'calm-free',title:'Calm Free Content',desc:'Daily meditations.',url:'https://www.calm.com'},
  {id:'7cups',title:'7 Cups of Tea',desc:'Free emotional support chat.',url:'https://www.7cups.com'},
  {id:'brain-health-seniors',title:'NIH Brain Health for Older Adults',desc:'Guides for cognitive health.',url:'https://www.nia.nih.gov/health/brain-health/brain-health-and-cognitive-function'}
];

let resources = {};
let showAll = false;

function loadVotes() {
  const saved = localStorage.getItem('mentalStrengthVotes');
  if (saved) resources = JSON.parse(saved);
  else resourcesData.forEach(r => resources[r.id] = {votes:0});
  renderResources();
}

function saveVotes() { localStorage.setItem('mentalStrengthVotes', JSON.stringify(resources)); }

function vote(id, delta) {
  if (resources[id]) {
    resources[id].votes += delta;
    saveVotes();
    renderResources();
  }
}

function renderResources() {
  const list = document.getElementById('resources-list');
  const sorted = resourcesData.slice().sort((a,b) => (resources[b.id]?.votes || 0) - (resources[a.id]?.votes || 0));
  const toShow = showAll ? sorted : sorted.slice(0,3);
  list.innerHTML = toShow.map(res => `
    <div class="resource" data-id="${res.id}">
      <h3><a href="${res.url}" target="_blank">${res.title}</a></h3>
      <p>${res.desc}</p>
      <div class="vote-buttons">
        <button class="vote-btn upvote" onclick="vote('${res.id}',1)">👍</button>
        <button class="vote-btn downvote" onclick="vote('${res.id}',-1)">👎</button>
        <span class="rating">Rating: ${resources[res.id]?.votes || 0}</span>
      </div>
    </div>
  `).join('');
  document.getElementById('show-more-btn').textContent = showAll ? 'Show Less' : 'Show More';
}

function toggleResources() {
  showAll = !showAll;
  renderResources();
}

function loadNews() {
  fetch('news.json').then(r => r.json()).then(d => {
    document.getElementById('news-feed').innerHTML = d.articles.slice(0,3).map(a => `
      <div class="news-item">
        <h3><a href="${a.url}" target="_blank">${a.title}</a></h3>
        <p>${a.summary}</p>
        <div class="news-date">${a.date}</div>
      </div>
    `).join('');
  }).catch(() => document.getElementById('news-feed').innerHTML = '<p>No news.</p>');
}

loadVotes();
loadNews();
