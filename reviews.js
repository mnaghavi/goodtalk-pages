const reviewsEndpoint = 'https://northamerica-northeast2-goodtalk-prod.cloudfunctions.net/websiteReviews';
const reviewsList = document.getElementById('reviews-list');
const reviewsStatus = document.getElementById('reviews-status');
const reviewsMore = document.getElementById('reviews-more');
const reviewForm = document.getElementById('review-form');
const formStatus = document.getElementById('review-form-status');
const turnstileContainer = document.getElementById('review-turnstile');
let nextCursor = null;
let turnstileWidgetId = null;
let turnstileTheme = null;
const starPath = 'm12 2.7 2.88 5.83 6.44.94-4.66 4.54 1.1 6.42L12 17.4l-5.76 3.03 1.1-6.42-4.66-4.54 6.44-.94L12 2.7Z';

function renderTurnstile() {
  if (!window.turnstile) return;
  const theme = document.body.dataset.theme === 'dark' ? 'dark' : 'light';
  if (turnstileWidgetId !== null && turnstileTheme === theme) return;
  if (turnstileWidgetId !== null) {
    window.turnstile.remove(turnstileWidgetId);
    turnstileWidgetId = null;
  }
  try {
    turnstileWidgetId = window.turnstile.render(turnstileContainer, {
      sitekey: turnstileContainer.dataset.sitekey,
      action: 'website_review',
      theme,
      size: 'flexible'
    });
    turnstileTheme = theme;
  } catch {
    formStatus.dataset.state = 'error';
    formStatus.textContent = 'Verification could not load. Please refresh the page.';
  }
}

new MutationObserver(renderTurnstile).observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
const turnstileScript = document.createElement('script');
turnstileScript.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
turnstileScript.async = true;
turnstileScript.onload = renderTurnstile;
turnstileScript.onerror = () => {
  formStatus.dataset.state = 'error';
  formStatus.textContent = 'Verification could not load. Please refresh the page.';
};
document.head.append(turnstileScript);

function createReviewCard(review) {
  const card = document.createElement('article');
  card.className = 'review-card';

  const stars = document.createElement('div');
  stars.className = 'review-card-stars';
  stars.setAttribute('aria-label', `${review.stars} out of 5 stars`);
  for (let index = 0; index < 5; index += 1) {
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('aria-hidden', 'true');
    if (index < review.stars) icon.classList.add('is-filled');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', starPath);
    icon.append(path);
    stars.append(icon);
  }

  const top = document.createElement('div');
  top.className = 'review-card-top';
  top.append(stars);
  if (review.source === 'appStore') {
    const source = document.createElement('span');
    source.className = 'review-card-source';
    source.textContent = 'App Store review';
    top.append(source);
  }

  const title = review.source === 'appStore' && typeof review.title === 'string' && review.title.trim()
    ? document.createElement('h3') : null;
  if (title) {
    title.className = 'review-card-title';
    title.textContent = review.title;
  }

  const quote = document.createElement('p');
  quote.textContent = review.text;

  const foot = document.createElement('div');
  foot.className = 'review-card-foot';
  const avatar = document.createElement('span');
  avatar.className = 'review-card-avatar';
  avatar.setAttribute('aria-hidden', 'true');
  avatar.textContent = review.name.trim().charAt(0).toUpperCase();
  const name = document.createElement('span');
  name.className = 'review-card-name';
  name.textContent = review.name;
  const date = document.createElement('time');
  date.className = 'review-card-date';
  if (Number.isFinite(review.publishedAt)) {
    const published = new Date(review.publishedAt);
    date.dateTime = published.toISOString();
    date.textContent = published.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
  }
  foot.append(avatar, name, date);
  card.append(top);
  if (title) card.append(title);
  card.append(quote, foot);
  return card;
}

async function loadReviews(cursor = null) {
  reviewsStatus.textContent = cursor ? 'Loading more reviews…' : 'Loading reviews…';
  reviewsMore.disabled = true;
  try {
    const url = cursor ? `${reviewsEndpoint}?cursor=${encodeURIComponent(cursor)}` : reviewsEndpoint;
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (response.status === 400 && cursor) return await loadReviews();
    if (!response.ok) throw new Error('Could not load reviews. Please try again later.');
    const data = await response.json();
    if (!Array.isArray(data.reviews)) throw new Error('Could not load reviews. Please try again later.');
    if (!cursor) reviewsList.replaceChildren();
    for (const review of data.reviews) {
      if (Number.isInteger(review.stars) && review.stars >= 1 && review.stars <= 5 && typeof review.name === 'string' && typeof review.text === 'string') {
        reviewsList.append(createReviewCard(review));
      }
    }
    nextCursor = typeof data.nextCursor === 'string' ? data.nextCursor : null;
    reviewsMore.hidden = !nextCursor;
    reviewsStatus.textContent = reviewsList.childElementCount ? '' : 'No reviews yet. You can be the first to share yours.';
  } catch (error) {
    reviewsStatus.textContent = error instanceof Error ? error.message : 'Could not load reviews. Please try again later.';
  } finally {
    reviewsMore.disabled = false;
  }
}

reviewsMore.addEventListener('click', () => {
  if (nextCursor) loadReviews(nextCursor);
});

reviewForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!reviewForm.reportValidity()) return;

  const fields = new FormData(reviewForm);
  const button = reviewForm.querySelector('button[type="submit"]');
  const submission = {
    name: String(fields.get('name') || '').trim(),
    stars: Number(fields.get('stars')),
    text: String(fields.get('text') || '').trim(),
    consent: fields.get('consent') === 'on',
    company: String(fields.get('company') || ''),
    turnstileToken: String(fields.get('cf-turnstile-response') || '')
  };
  if (!submission.turnstileToken) {
    formStatus.dataset.state = 'error';
    formStatus.textContent = 'Please complete the verification before sending your review.';
    return;
  }
  button.disabled = true;
  formStatus.dataset.state = '';
  formStatus.textContent = 'Sending your review…';
  try {
    const response = await fetch(reviewsEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(submission)
    });
    if (!response.ok) {
      if (response.status === 429) throw new Error('Too many attempts. Please try again later.');
      if (response.status === 403) throw new Error('Verification expired or failed. Please try again.');
      if (response.status === 503) throw new Error('Verification is temporarily unavailable. Please try again later.');
      if (response.status === 400) throw new Error('Please check the rating, name, review and permission box.');
      throw new Error('Your review could not be sent. Please try again later.');
    }
    reviewForm.reset();
    formStatus.dataset.state = 'success';
    formStatus.textContent = 'Thank you. Your review was received and will appear here if approved.';
  } catch (error) {
    formStatus.dataset.state = 'error';
    formStatus.textContent = error instanceof Error ? error.message : 'Your review could not be sent. Please try again later.';
  } finally {
    if (turnstileWidgetId !== null) window.turnstile?.reset(turnstileWidgetId);
    button.disabled = false;
  }
});

loadReviews();
