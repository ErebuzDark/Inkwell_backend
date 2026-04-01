/**
 * data.service.js — Unified data layer
 *
 * Strategy:
 *   1. Use MangaDex API exclusively (Scraper removed due to blocking)
 *   2. Cache results with node-cache to reduce repeat requests
 *
 * Every exported function is what the controllers call.
 */

import NodeCache from 'node-cache';

import {
    mdGetPopularManga,
    mdGetMangaDetail,
    mdGetChapterPages,
    mdSearchManga,
    mdGetLatestUpdates,
    mdGetTags,
    mdGetTagsSync,
    mdGetRelatedManga,
    mdGetTrending,
} from './mangadex.service.js';

// Cache TTLs (seconds)
const CACHE_LIST = 10 * 60;   // 10 min  — popular / latest lists
const CACHE_DETAIL = 15 * 60;   // 15 min  — manga detail + chapter list
const CACHE_CHAPTER = 5 * 60;   //  5 min  — chapter pages (CDN URLs expire)
const CACHE_SEARCH = 2 * 60;   //  2 min  — search results

const cache = new NodeCache({ stdTTL: CACHE_LIST, checkperiod: 120 });

// ─── Cached wrapper with stale-while-revalidate ──────────────────────────────
async function cached(key, ttl, fn) {
    const hit = cache.get(key);
    if (hit !== undefined) {
        // Stale-while-revalidate: if less than 20% TTL remaining, refresh in bg
        const ttlRemaining = cache.getTtl(key);
        if (ttlRemaining && (ttlRemaining - Date.now()) < ttl * 200) {
            fn().then((value) => cache.set(key, value, ttl)).catch(() => {});
        }
        return hit;
    }
    const value = await fn();
    cache.set(key, value, ttl);
    return value;
}

// ─── Cache warming on startup ────────────────────────────────────────────────
setTimeout(async () => {
    try {
        console.log('[Cache] Warming popular & trending...');
        await cached('popular_p1', CACHE_LIST, () => mdGetPopularManga(1));
        await cached('trending', CACHE_LIST, () => mdGetTrending());
        await cached('latest_updates', CACHE_LIST, () => mdGetLatestUpdates());
        console.log('[Cache] Warm-up complete ✓');
    } catch (err) {
        console.warn('[Cache] Warm-up failed:', err.message);
    }
}, 2000);

// ─── Public API (used by controllers) ────────────────────────────────────────

/**
 * Get popular / trending manga list.
 */
export async function getPopularManga(page = 1) {
    const key = `popular_p${page}`;
    return cached(key, CACHE_LIST, () => mdGetPopularManga(page));
}

/**
 * Get full manga detail including chapter list.
 */
export async function getMangaDetail(id) {
    const key = `detail_${id}`;
    return cached(key, CACHE_DETAIL, () => mdGetMangaDetail(id));
}

/**
 * Get chapter page image URLs.
 */
export async function getChapterPages(chapterId) {
    const key = `chapter_${chapterId}`;
    return cached(key, CACHE_CHAPTER, () => {
        const isMangaDexId = /^[0-9a-f-]{36}$/.test(chapterId);

        if (isMangaDexId) {
            return mdGetChapterPages(chapterId);
        }

        console.warn(`[data] Attempted to fetch non-MangaDex chapter ID: ${chapterId}`);
        throw new Error('Chapter pages unavailable: the scraper is disabled and this ID is incompatible.');
    });
}

/**
 * Search manga by query + optional filters.
 */
export async function searchManga(query = '', filters = {}) {
    const key = `search_${query}_${JSON.stringify(filters)}`;
    return cached(key, CACHE_SEARCH, () => mdSearchManga(query, filters));
}

/**
 * Get recently updated titles for the homepage.
 */
export async function getLatestUpdates() {
    const key = 'latest_updates';
    return cached(key, CACHE_LIST, () => mdGetLatestUpdates());
}

export const ALL_GENRES = mdGetTagsSync();
export const ALL_RATINGS = ['Safe', 'Suggestive', 'Erotica', 'Pornographic'];


/**
 * Expose cache stats for debugging (optional health endpoint).
 */
export function getCacheStats() {
    return cache.getStats();
}

/**
 * Get related manga by shared genres/tags.
 */
export async function getRelatedManga(id) {
    const key = `related_${id}`;
    return cached(key, CACHE_DETAIL, () => mdGetRelatedManga(id));
}

/**
 * Get trending manga (recently popular).
 */
export async function getTrendingManga() {
    const key = 'trending';
    return cached(key, CACHE_LIST, () => mdGetTrending());
}