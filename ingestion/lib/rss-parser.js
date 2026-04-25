// rss-parser.js — minimal RSS 2.0 parser, no dependencies.
//
// Handles the subset of RSS 2.0 actually used by The Dink (Ghost) and
// Pickleball Union (WordPress): <item> with <title>, <link>, <description>,
// <pubDate>, <dc:creator>, <category>, <guid>, <content:encoded>,
// <media:content>. CDATA sections are unwrapped. HTML is left raw — caller
// is responsible for stripping/escaping before render.

const https = require('https');
const http = require('http');
const { URL } = require('url');

const USER_AGENT = 'Mozilla/5.0 (compatible; PickleballDailyBot/1.0; +https://jjmgladden.github.io/pickleball-daily/)';
const FETCH_TIMEOUT_MS = 12000;

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === 'http:' ? http : https;
    const req = lib.get(url, {
      headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/rss+xml, application/xml, text/xml, */*' },
      timeout: FETCH_TIMEOUT_MS
    }, res => {
      // Follow one redirect (301/302) to handle www-canonical or http→https
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = new URL(res.headers.location, url).toString();
        res.resume();
        return resolve(fetchText(redirectUrl));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error('HTTP ' + res.statusCode + ' for ' + url));
      }
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve(body));
    });
    req.on('timeout', () => { req.destroy(new Error('timeout after ' + FETCH_TIMEOUT_MS + 'ms')); });
    req.on('error', reject);
  });
}

function unwrapCdata(s) {
  if (s == null) return '';
  return String(s).replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1').trim();
}

function decodeEntities(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)))
    .replace(/&nbsp;/g, ' ');
}

function stripHtml(s) {
  if (!s) return '';
  return decodeEntities(
    String(s)
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
  ).replace(/\s+/g, ' ').trim();
}

function firstTag(xml, tag) {
  const re = new RegExp('<' + tag + '(?:\\s[^>]*)?>([\\s\\S]*?)<\\/' + tag + '>');
  const m = xml.match(re);
  return m ? unwrapCdata(m[1]) : '';
}

function firstAttr(xml, tag, attr) {
  const re = new RegExp('<' + tag + '\\s[^>]*' + attr + '="([^"]+)"', 'i');
  const m = xml.match(re);
  return m ? m[1] : '';
}

function parseRss(xml, { sourceId, sourceName, tier, feedUrl }) {
  const items = [];
  const itemRe = /<item\b[^>]*>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1];
    const title = stripHtml(firstTag(block, 'title'));
    const link = stripHtml(firstTag(block, 'link'));
    const description = firstTag(block, 'description');
    const contentEncoded = firstTag(block, 'content:encoded');
    const pubDate = firstTag(block, 'pubDate');
    const creator = firstTag(block, 'dc:creator');
    const guid = firstTag(block, 'guid');

    const categories = [];
    const catRe = /<category(?:\s[^>]*)?>([\s\S]*?)<\/category>/g;
    let cm;
    while ((cm = catRe.exec(block)) !== null) {
      const c = stripHtml(unwrapCdata(cm[1]));
      if (c) categories.push(c);
    }

    const imageUrl = firstAttr(block, 'media:content', 'url') || firstAttr(block, 'media:thumbnail', 'url') || '';

    let publishedAt = null;
    if (pubDate) {
      const d = new Date(pubDate);
      if (!isNaN(d.getTime())) publishedAt = d.toISOString();
    }

    const summary = stripHtml(description || contentEncoded).slice(0, 280);

    if (!title || !link) continue;

    items.push({
      id: guid || link,
      title,
      url: link,
      summary,
      author: stripHtml(creator) || null,
      categories,
      imageUrl: imageUrl || null,
      publishedAt,
      sourceId,
      sourceName,
      tier,
      feedUrl
    });
  }
  return items;
}

async function fetchFeed({ sourceId, sourceName, tier, feedUrl }) {
  const xml = await fetchText(feedUrl);
  return parseRss(xml, { sourceId, sourceName, tier, feedUrl });
}

module.exports = { fetchFeed, parseRss, fetchText, stripHtml };
