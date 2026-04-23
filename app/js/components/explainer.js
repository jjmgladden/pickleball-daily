// explainer.js — small collapsible "What is this?" card for tabs that need a one-paragraph primer.
// Copy for the Ratings-vs-Rankings distinction is sourced from KB-0009.

export const RATINGS_VS_RANKINGS_COPY = {
  rating:
    "A DUPR rating is a skill score on a 2.0–8.0+ scale, updated after every match, that estimates how well you play against any opponent — think of it like a chess Elo. " +
    "It answers: how good is this player, overall?",
  ranking:
    "A PPA ranking is a leaderboard position earned from recent pro tournament results, so it measures who is currently winning on tour, not overall skill. " +
    "It answers: who is hot right now on the pro circuit?",
};

export function explainerHtml({ title, bodyHtml, id }) {
  const safeId = (id || 'explainer').replace(/[^a-z0-9-]/gi, '-');
  return (
    '<details class="explainer" id="' + safeId + '">' +
      '<summary>' + title + '</summary>' +
      '<div class="explainer-body">' + bodyHtml + '</div>' +
    '</details>'
  );
}

export function ratingsVsRankingsExplainer(scope) {
  const body =
    '<p><strong>Rating (DUPR):</strong> ' + RATINGS_VS_RANKINGS_COPY.rating + '</p>' +
    '<p><strong>Ranking (PPA Tour):</strong> ' + RATINGS_VS_RANKINGS_COPY.ranking + '</p>' +
    '<p class="muted">Two different questions, two different answers. A player can be #3 in PPA rankings but have a 7.1 DUPR; another can carry a 7.3 DUPR but not play enough tour events to rank at all.</p>';
  const suffix = scope ? '-' + String(scope) : '';
  return explainerHtml({
    title: 'What is this? Rating vs Ranking',
    bodyHtml: body,
    id: 'explainer-rating-vs-ranking' + suffix,
  });
}
