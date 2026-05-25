/* ─── Navigation ───────────────────────────── */
const nav = document.querySelector('.nav');
const menuBtn = document.querySelector('.nav-menu-btn');
const mobileMenu = document.querySelector('.mobile-menu');

window.addEventListener('scroll', () => {
  nav?.classList.toggle('scrolled', window.scrollY > 20);
  updateProgressBar();
  updateTocActive();
});

menuBtn?.addEventListener('click', () => {
  mobileMenu?.classList.toggle('open');
});

document.addEventListener('click', (e) => {
  if (!nav?.contains(e.target)) mobileMenu?.classList.remove('open');
});

/* ─── Active Nav Link ──────────────────────── */
const currentPath = window.location.pathname;
document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(link => {
  const href = link.getAttribute('href') || '';
  if (href === currentPath || (currentPath.endsWith('/') && href === '/index.html')) {
    link.classList.add('active');
  } else if (currentPath.includes('/posts/') && href.includes('blog.html')) {
    link.classList.add('active');
  } else if (currentPath.includes('blog.html') && href.includes('blog.html')) {
    link.classList.add('active');
  } else if (currentPath.includes('about.html') && href.includes('about.html')) {
    link.classList.add('active');
  }
});

/* ─── Progress Bar ─────────────────────────── */
function updateProgressBar() {
  const bar = document.getElementById('progress-bar');
  if (!bar) return;
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  bar.style.width = docHeight > 0 ? (scrollTop / docHeight * 100) + '%' : '0%';
}

/* ─── Fade-up Animations ───────────────────── */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

/* ─── Like System (실제 공유 카운터) ──────── */
const LIKE_API = 'https://api.counterapi.dev/v1/nextiar-blog';

async function fetchCount(postId) {
  try {
    const r = await fetch(`${LIKE_API}/${postId}/get`);
    if (!r.ok) return 0;
    return (await r.json()).count || 0;
  } catch { return 0; }
}

async function incrementCount(postId) {
  try {
    const r = await fetch(`${LIKE_API}/${postId}/up`);
    if (!r.ok) return null;
    return (await r.json()).count || null;
  } catch { return null; }
}

function initLikeSystem() {
  const likeBtn = document.querySelector('.like-btn');
  if (!likeBtn) return;

  const postId = document.body.dataset.postId;
  if (!postId) return;
  const storageKey = `liked_${postId}`;

  if (localStorage.getItem(storageKey) === 'true') likeBtn.classList.add('liked');

  fetchCount(postId).then(updateLikeDisplay);

  likeBtn.addEventListener('click', async () => {
    const wasLiked = likeBtn.classList.contains('liked');
    likeBtn.classList.toggle('liked');

    if (wasLiked) {
      localStorage.removeItem(storageKey);
      updateLikeDisplay(await fetchCount(postId));
      showToast('좋아요를 취소했습니다');
    } else {
      localStorage.setItem(storageKey, 'true');
      likeBtn.querySelector('.like-icon').style.transform = 'scale(1.5)';
      setTimeout(() => { likeBtn.querySelector('.like-icon').style.transform = ''; }, 300);
      const n = await incrementCount(postId);
      if (n !== null) updateLikeDisplay(n);
      showToast('좋아요를 눌렀습니다 ❤️');
    }
  });

  function updateLikeDisplay(n) {
    const el = document.querySelector('.like-count-display');
    if (el) el.textContent = n > 0 ? `${n}명이 좋아합니다` : '첫 번째로 좋아요를 눌러보세요';
  }
}

/* ─── TOC Active ───────────────────────────── */
function updateTocActive() {
  const headings = document.querySelectorAll('.post-content h2, .post-content h3');
  const tocLinks = document.querySelectorAll('.post-toc a');
  if (!headings.length) return;

  let current = '';
  headings.forEach(h => {
    if (h.getBoundingClientRect().top < 120) current = h.id;
  });
  tocLinks.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
  });
}

/* ─── Share ────────────────────────────────── */
function initShare() {
  document.querySelectorAll('.share-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.share;
      const url = encodeURIComponent(location.href);
      const title = encodeURIComponent(document.title);
      if (type === 'copy') {
        navigator.clipboard.writeText(location.href).then(() => showToast('링크가 복사되었습니다'));
      } else if (type === 'twitter') {
        window.open(`https://twitter.com/intent/tweet?url=${url}&text=${title}`);
      } else if (type === 'linkedin') {
        window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}`);
      }
    });
  });
}

/* ─── Toast ────────────────────────────────── */
function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2500);
}

/* ─── Blog Filter ──────────────────────────── */
function initBlogFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const postCards = document.querySelectorAll('.post-card-wrap');
  const searchInput = document.querySelector('.search-input');
  const noPostsMsg = document.querySelector('.no-posts');
  let activeFilter = 'all';
  let searchQuery = '';

  function filterPosts() {
    let visible = 0;
    postCards.forEach(card => {
      const category = card.dataset.category || '';
      const text = card.textContent.toLowerCase();
      const matchFilter = activeFilter === 'all' || category.includes(activeFilter);
      const matchSearch = !searchQuery || text.includes(searchQuery.toLowerCase());
      const show = matchFilter && matchSearch;
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });
    if (noPostsMsg) noPostsMsg.style.display = visible === 0 ? 'block' : 'none';
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      filterPosts();
    });
  });

  searchInput?.addEventListener('input', e => {
    searchQuery = e.target.value;
    filterPosts();
  });
}

/* ─── Init ─────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initLikeSystem();
  initShare();
  initBlogFilter();
});
