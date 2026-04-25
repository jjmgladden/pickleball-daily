/**
 * Email template builder — v1
 *
 * Builds rich HTML + plain-text fallback + subject for the morning email
 * from a fresh daily snapshot. Tailored for pickleball: PPA + MLP events,
 * top rankings, top ratings, recent highlights. No external dependencies.
 *
 * Inline styles only (Gmail/Outlook strip <style> blocks). Dark-friendly
 * palette mirroring app/styles/main.css. Plain-text fallback for clients
 * that block HTML.
 */

const SITE_URL = 'https://jjmgladden.github.io/pickleball-daily/';

const HISTORY_SEED_PATH = require('path').resolve(__dirname, '..', '..', 'data', 'master', 'history-seed.json');

function loadHistoryMilestones() {
  try { return require('fs').existsSync(HISTORY_SEED_PATH) ? JSON.parse(require('fs').readFileSync(HISTORY_SEED_PATH, 'utf8')).milestones || [] : []; }
  catch { return []; }
}

function findOnThisDay(milestones, refDate) {
  const mm = String(refDate.getMonth() + 1).padStart(2, '0');
  const dd = String(refDate.getDate()).padStart(2, '0');
  return (milestones || [])
    .filter(m => {
      if (!m.date || typeof m.date !== 'string') return false;
      const parts = m.date.split('-');
      if (parts.length < 3) return false;
      return parts[1] !== '00' && parts[2] !== '00' && parts[1] === mm && parts[2] === dd;
    })
    .sort((a, b) => (b.year || 0) - (a.year || 0));
}

function buildEmail(snapshot) {
  const generatedAt = snapshot && snapshot.generatedAt ? new Date(snapshot.generatedAt) : new Date();
  const dateFormatted = formatLongDate(generatedAt);

  const tournaments = (snapshot && snapshot.sources && snapshot.sources.tournaments) || {};
  const buckets = tournaments.buckets || {};
  const inProgress = (buckets.inProgress || []).slice(0, 3);
  const upcoming = (buckets.upcoming || []).slice(0, 4);

  const rankings = ((snapshot && snapshot.sources && snapshot.sources.ppaRankings && snapshot.sources.ppaRankings.rankings) || []).slice(0, 5);
  const ratings = ((snapshot && snapshot.sources && snapshot.sources.dupr && snapshot.sources.dupr.top20) || []).slice(0, 5);
  const videos = collectTopVideos(snapshot, 4);
  const news = ((snapshot && snapshot.sources && snapshot.sources.news && snapshot.sources.news.items) || []).slice(0, 3);
  const onThisDay = findOnThisDay(loadHistoryMilestones(), generatedAt);

  const subject = buildSubject(inProgress, upcoming, dateFormatted);
  const html = buildHtml({ dateFormatted, inProgress, upcoming, rankings, ratings, videos, news, onThisDay });
  const text = buildPlainText({ dateFormatted, inProgress, upcoming, rankings, ratings, videos, news, onThisDay });

  return { subject, html, text };
}

function buildSubject(inProgress, upcoming, dateFormatted) {
  if (inProgress.length) {
    const ev = inProgress[0];
    return '🏓 Live: ' + ev.displayName + ' — ' + dateFormatted;
  }
  if (upcoming.length) {
    const ev = upcoming[0];
    return '🏓 Next up: ' + ev.displayName + ' (' + shortDate(ev.startDate) + ') — ' + dateFormatted;
  }
  return "🏓 Ozark Joe's Pickleball Daily — " + dateFormatted;
}

function buildHtml({ dateFormatted, inProgress, upcoming, rankings, ratings, videos, news, onThisDay }) {
  return ('' +
    '<!DOCTYPE html>' +
    '<html><head><meta charset="utf-8"></head>' +
    '<body style="margin:0; padding:0; background:#0e1420; font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif; color:#f2f4f8;">' +
    '<div style="max-width:600px; margin:0 auto; padding:24px 16px;">' +

      // Header
      '<div style="font-size:28px;">🏓</div>' +
      '<div style="font-size:20px; font-weight:700; color:#ffffff; margin-top:6px;">Ozark Joe\u2019s Pickleball Daily</div>' +
      '<div style="font-size:13px; color:#9aa4b8; margin-top:2px;">' + escapeHtml(dateFormatted) + '</div>' +

      // Live Now
      (inProgress.length
        ? '<div style="margin-top:24px;">' +
            '<div style="font-size:13px; font-weight:700; color:#ffd24a; text-transform:uppercase; letter-spacing:0.08em;">Live Now</div>' +
            inProgress.map(eventCardHtml).join('') +
          '</div>'
        : ''
      ) +

      // Upcoming
      (upcoming.length
        ? '<div style="margin-top:24px;">' +
            '<div style="font-size:13px; font-weight:700; color:#ffd24a; text-transform:uppercase; letter-spacing:0.08em;">Upcoming (next 30 days)</div>' +
            upcoming.map(eventCardHtml).join('') +
          '</div>'
        : ''
      ) +

      // Top PPA Rankings
      (rankings.length
        ? '<div style="margin-top:24px;">' +
            '<div style="font-size:13px; font-weight:700; color:#ffd28c; text-transform:uppercase; letter-spacing:0.08em;">Top PPA Rankings (52-Week)</div>' +
            '<table cellpadding="0" cellspacing="0" border="0" style="margin-top:10px; width:100%;">' +
              rankings.map(rankingRowHtml).join('') +
            '</table>' +
          '</div>'
        : ''
      ) +

      // Top DUPR Ratings
      (ratings.length
        ? '<div style="margin-top:24px;">' +
            '<div style="font-size:13px; font-weight:700; color:#7be5a7; text-transform:uppercase; letter-spacing:0.08em;">Top DUPR Ratings (Doubles)</div>' +
            '<table cellpadding="0" cellspacing="0" border="0" style="margin-top:10px; width:100%;">' +
              ratings.map(ratingRowHtml).join('') +
            '</table>' +
          '</div>'
        : ''
      ) +

      // Top Highlights
      (videos.length
        ? '<div style="margin-top:24px;">' +
            '<div style="font-size:13px; font-weight:700; color:#4ea8ff; text-transform:uppercase; letter-spacing:0.08em;">Top Highlights</div>' +
            videos.map(videoRowHtml).join('') +
          '</div>'
        : ''
      ) +

      // Top News
      ((news && news.length)
        ? '<div style="margin-top:24px;">' +
            '<div style="font-size:13px; font-weight:700; color:#c69aff; text-transform:uppercase; letter-spacing:0.08em;">Top News</div>' +
            news.map(newsRowHtml).join('') +
          '</div>'
        : ''
      ) +

      // On This Day in Pickleball
      ((onThisDay && onThisDay.length)
        ? '<div style="margin-top:24px;">' +
            '<div style="font-size:13px; font-weight:700; color:#7be5a7; text-transform:uppercase; letter-spacing:0.08em;">On This Day in Pickleball</div>' +
            onThisDay.map(otdRowHtml).join('') +
          '</div>'
        : ''
      ) +

      // CTA
      '<div style="text-align:center; margin:32px 0 20px;">' +
        '<a href="' + SITE_URL + '" style="background:#ffd24a; color:#0e1420; text-decoration:none; padding:14px 28px; border-radius:8px; font-size:16px; font-weight:700; display:inline-block;">Open the full report →</a>' +
      '</div>' +

      // Footer
      '<div style="border-top:1px solid #263147; padding-top:16px; margin-top:28px; font-size:11px; color:#9aa4b8; text-align:center;">' +
        'Daily morning briefing from Ozark Joe\u2019s Pickleball Daily Intelligence Report.<br>' +
        '<a href="' + SITE_URL + '" style="color:#4ea8ff; text-decoration:none;">' + SITE_URL + '</a>' +
      '</div>' +

    '</div></body></html>'
  ).trim();
}

function eventCardHtml(ev) {
  const dateRange = ev.startDate === ev.endDate
    ? shortDate(ev.startDate)
    : shortDate(ev.startDate) + ' – ' + shortDate(ev.endDate);
  const location = [ev.city, ev.state].filter(Boolean).join(', ');
  const tier = [ev.circuit, ev.tier].filter(Boolean).join(' · ');
  return (
    '<div style="background:#151c2d; border:1px solid #263147; border-left:3px solid #ffd24a; border-radius:8px; padding:12px 14px; margin-top:10px;">' +
      '<div style="font-size:15px; color:#ffffff; font-weight:600;">' + escapeHtml(ev.displayName || '') + '</div>' +
      '<div style="font-size:13px; color:#9aa4b8; margin-top:2px;">' + escapeHtml(dateRange + (location ? ' · ' + location : '')) + '</div>' +
      (tier ? '<div style="font-size:12px; color:#9aa4b8; margin-top:4px; text-transform:uppercase; letter-spacing:0.05em;">' + escapeHtml(tier) + '</div>' : '') +
    '</div>'
  );
}

function rankingRowHtml(r) {
  return (
    '<tr>' +
      '<td style="padding:6px 8px 6px 0; width:40px; vertical-align:top;">' +
        '<span style="display:inline-block; background:#3a2a1a; color:#ffd28c; border:1px solid #7a5a2f; border-radius:6px; padding:2px 8px; font-size:13px; font-weight:700;">#' + escapeHtml(String(r.rank || '')) + '</span>' +
      '</td>' +
      '<td style="padding:6px 0; vertical-align:top;">' +
        '<div style="font-size:14px; color:#ffffff; font-weight:600;">' + escapeHtml(r.playerName || '') + '</div>' +
        '<div style="font-size:12px; color:#9aa4b8;">' + escapeHtml((r.points != null ? r.points + ' pts' : '') + (r.age != null ? ' · age ' + r.age : '') + (r.country ? ' · ' + r.country : '')) + '</div>' +
      '</td>' +
    '</tr>'
  );
}

function ratingRowHtml(r) {
  return (
    '<tr>' +
      '<td style="padding:6px 8px 6px 0; width:60px; vertical-align:top;">' +
        '<span style="display:inline-block; background:#1a3a2a; color:#7be5a7; border:1px solid #2f7a4f; border-radius:999px; padding:2px 10px; font-size:13px; font-weight:600; font-family:Consolas,Menlo,monospace;">' + escapeHtml(String(r.rating != null ? r.rating.toFixed(3) : '—')) + '</span>' +
      '</td>' +
      '<td style="padding:6px 0; vertical-align:top;">' +
        '<div style="font-size:14px; color:#ffffff; font-weight:600;">' + escapeHtml(r.displayName || '') + '</div>' +
        (r.country ? '<div style="font-size:12px; color:#9aa4b8;">' + escapeHtml(r.country) + '</div>' : '') +
      '</td>' +
    '</tr>'
  );
}

function videoRowHtml(v) {
  const url = 'https://www.youtube.com/watch?v=' + encodeURIComponent(v.videoId);
  const thumb = 'https://i.ytimg.com/vi/' + encodeURIComponent(v.videoId) + '/mqdefault.jpg';
  const dateLabel = v.publishedAt ? shortDate(v.publishedAt.slice(0, 10)) : '';
  return (
    '<a href="' + url + '" style="display:block; text-decoration:none; color:inherit; margin-top:10px;">' +
      '<table cellpadding="0" cellspacing="0" border="0" style="width:100%;">' +
        '<tr>' +
          '<td style="width:140px; padding-right:12px; vertical-align:top;">' +
            '<img src="' + thumb + '" alt="" width="120" height="68" style="display:block; border-radius:6px;">' +
          '</td>' +
          '<td style="vertical-align:top;">' +
            '<div style="font-size:14px; color:#ffffff; font-weight:600; line-height:1.3;">' + escapeHtml(v.title || '') + '</div>' +
            '<div style="font-size:12px; color:#9aa4b8; margin-top:4px;">' + escapeHtml((v.channelTitle || '') + (dateLabel ? ' · ' + dateLabel : '')) + '</div>' +
          '</td>' +
        '</tr>' +
      '</table>' +
    '</a>'
  );
}

function newsRowHtml(n) {
  const url = n.url || '#';
  const dateLabel = n.publishedAt ? shortDate(n.publishedAt.slice(0, 10)) : '';
  const meta = [n.sourceName, dateLabel].filter(Boolean).join(' · ');
  return (
    '<a href="' + escapeHtml(url) + '" style="display:block; text-decoration:none; color:inherit; margin-top:10px;">' +
      '<div style="background:#151c2d; border:1px solid #263147; border-left:3px solid #c69aff; border-radius:8px; padding:12px 14px;">' +
        '<div style="font-size:14px; color:#ffffff; font-weight:600; line-height:1.35;">' + escapeHtml(n.title || '') + '</div>' +
        (meta ? '<div style="font-size:12px; color:#9aa4b8; margin-top:4px;">' + escapeHtml(meta) + '</div>' : '') +
        (n.summary ? '<div style="font-size:13px; color:#c8cfdb; margin-top:6px; line-height:1.45;">' + escapeHtml(n.summary) + '</div>' : '') +
      '</div>' +
    '</a>'
  );
}

function otdRowHtml(m) {
  const yearsAgo = m.year ? new Date().getFullYear() - m.year : null;
  const yearLabel = m.year ? String(m.year) + (yearsAgo > 0 ? ' (' + yearsAgo + ' yr ago)' : '') : '';
  return (
    '<div style="background:#151c2d; border:1px solid #263147; border-left:3px solid #7be5a7; border-radius:8px; padding:12px 14px; margin-top:10px;">' +
      '<div style="font-size:12px; color:#7be5a7; font-weight:700; letter-spacing:0.04em;">' + escapeHtml(yearLabel) + '</div>' +
      '<div style="font-size:14px; color:#ffffff; font-weight:600; margin-top:2px;">' + escapeHtml(m.displayName || '') + '</div>' +
      (m.summary ? '<div style="font-size:13px; color:#c8cfdb; margin-top:6px; line-height:1.45;">' + escapeHtml(m.summary) + '</div>' : '') +
    '</div>'
  );
}

function buildPlainText({ dateFormatted, inProgress, upcoming, rankings, ratings, videos, news, onThisDay }) {
  const lines = [];
  lines.push("OZARK JOE'S PICKLEBALL DAILY — " + dateFormatted);
  lines.push('');

  if (inProgress.length) {
    lines.push('LIVE NOW');
    inProgress.forEach(ev => {
      lines.push('  ' + ev.displayName);
      lines.push('    ' + dateRangeText(ev) + (ev.city ? ' · ' + ev.city + (ev.state ? ', ' + ev.state : '') : ''));
    });
    lines.push('');
  }

  if (upcoming.length) {
    lines.push('UPCOMING (next 30 days)');
    upcoming.forEach(ev => {
      lines.push('  ' + ev.displayName);
      lines.push('    ' + dateRangeText(ev) + (ev.city ? ' · ' + ev.city + (ev.state ? ', ' + ev.state : '') : ''));
    });
    lines.push('');
  }

  if (rankings.length) {
    lines.push('TOP PPA RANKINGS');
    rankings.forEach(r => {
      lines.push('  #' + r.rank + '  ' + r.playerName + (r.points != null ? '  (' + r.points + ' pts)' : ''));
    });
    lines.push('');
  }

  if (ratings.length) {
    lines.push('TOP DUPR RATINGS (DOUBLES)');
    ratings.forEach(r => {
      lines.push('  ' + (r.rating != null ? r.rating.toFixed(3) : '—').padEnd(7) + r.displayName + (r.country ? '  (' + r.country + ')' : ''));
    });
    lines.push('');
  }

  if (videos.length) {
    lines.push('TOP HIGHLIGHTS');
    videos.forEach(v => {
      lines.push('  ' + v.title);
      lines.push('    ' + (v.channelTitle || '') + ' — https://youtu.be/' + v.videoId);
    });
    lines.push('');
  }

  if (news && news.length) {
    lines.push('TOP NEWS');
    news.forEach(n => {
      lines.push('  ' + n.title);
      const dateLabel = n.publishedAt ? n.publishedAt.slice(0, 10) : '';
      const meta = [n.sourceName, dateLabel].filter(Boolean).join(' · ');
      if (meta) lines.push('    ' + meta);
      lines.push('    ' + (n.url || ''));
    });
    lines.push('');
  }

  if (onThisDay && onThisDay.length) {
    lines.push('ON THIS DAY IN PICKLEBALL');
    onThisDay.forEach(m => {
      lines.push('  ' + (m.year || '') + ' — ' + (m.displayName || ''));
      if (m.summary) lines.push('    ' + m.summary);
    });
    lines.push('');
  }

  lines.push('Open the full report: ' + SITE_URL);
  lines.push('');
  lines.push("— Ozark Joe's Pickleball Daily Intelligence Report");
  return lines.join('\n');
}

function collectTopVideos(snapshot, max) {
  const channels = (snapshot && snapshot.sources && snapshot.sources.highlights && snapshot.sources.highlights.channels) || [];
  const all = [];
  channels.forEach(ch => {
    (ch.videos || []).forEach(v => all.push(Object.assign({}, v, { channelTitle: v.channelTitle || ch.channelTitle })));
  });
  all.sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
  return all.slice(0, max);
}

function dateRangeText(ev) {
  if (ev.startDate === ev.endDate) return shortDate(ev.startDate);
  return shortDate(ev.startDate) + ' – ' + shortDate(ev.endDate);
}

function shortDate(ymd) {
  if (!ymd) return '';
  const parts = String(ymd).split('-');
  if (parts.length < 3) return ymd;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatLongDate(d) {
  try {
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

module.exports = { buildEmail };
