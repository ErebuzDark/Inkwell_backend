/**
 * mangadex.service.js
 * Fallback data source — MangaDex public REST API (no key required)
 * Docs: https://api.mangadex.org/docs/
 */

import axios from 'axios';

const BASE = 'https://api.mangadex.org';
const COVER_BASE = 'https://uploads.mangadex.org/covers';

const mdApi = axios.create({
    baseURL: BASE,
    timeout: 12000,
    headers: { 'User-Agent': 'Inkwell-MangaReader/1.0' },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTitle(attr) {
    return (
        attr.title?.en ||
        attr.title?.['ja-ro'] ||
        attr.title?.ja ||
        Object.values(attr.title || {})[0] ||
        'Untitled'
    );
}

function getDescription(attr) {
    return attr.description?.en || Object.values(attr.description || {})[0] || '';
}

function getType(originalLanguage) {
    switch (originalLanguage) {
        case 'ja': return 'Manga';
        case 'ko': return 'Manhwa';
        case 'zh':
        case 'zh-hk': return 'Manhua';
        default: return 'Manga';
    }
}

function getCoverUrl(mangaId, relationships) {
    const cover = relationships?.find((r) => r.type === 'cover_art');
    const fileName = cover?.attributes?.fileName;
    return fileName ? `${COVER_BASE}/${mangaId}/${fileName}.512.jpg` : null;
}

function getAuthor(relationships) {
    return relationships?.find((r) => r.type === 'author')?.attributes?.name || 'Unknown';
}

function mapManga(item) {
    const attr = item.attributes;
    const relationships = item.relationships || [];
    return {
        id: item.id,
        title: getTitle(attr),
        description: getDescription(attr),
        status: attr.status
            ? attr.status.charAt(0).toUpperCase() + attr.status.slice(1)
            : 'Unknown',
        type: getType(attr.originalLanguage),
        genres: (attr.tags || [])
            .filter((t) => ['genre', 'theme'].includes(t.attributes?.group))
            .map((t) => t.attributes.name?.en || t.attributes.name?.ja || '')
            .filter(Boolean),
        cover: getCoverUrl(item.id, relationships),
        author: getAuthor(relationships),
        rating: attr.rating?.average ? parseFloat(attr.rating.average).toFixed(1) : null,
        views: null, // MangaDex doesn't expose view counts
        source: 'mangadex',
    };
}

function mapChapter(ch) {
    return {
        id: ch.id,
        number: parseFloat(ch.attributes.chapter) || 0,
        title: ch.attributes.title || `Chapter ${ch.attributes.chapter}`,
        date: ch.attributes.publishAt?.split('T')[0] || '',
    };
}

const COMMON_PARAMS = {
    availableTranslatedLanguage: ['en'],
    contentRating: ['suggestive'], // 'safe' is for children, 'suggestive' is for teens, 'explicit' is for adults
};

// ─── Exports ─────────────────────────────────────────────────────────────────

export async function mdGetPopularManga(page = 1) {
    const { data } = await mdApi.get('/manga', {
        params: {
            ...COMMON_PARAMS,
            limit: 24,
            offset: (page - 1) * 24,
            'order[followedCount]': 'desc',
            includes: ['cover_art', 'author'],
        },
    });

    return {
        titles: data.data.map(mapManga),
        totalPages: Math.ceil(data.total / 24),
        currentPage: page,
        source: 'mangadex',
    };
}

export async function mdGetMangaDetail(id) {
    const [mangaRes, chaptersRes] = await Promise.all([
        mdApi.get(`/manga/${id}`, {
            params: { includes: ['cover_art', 'author', 'artist'] },
        }),
        mdApi.get(`/manga/${id}/feed`, {
            params: {
                translatedLanguage: ['en'],
                contentRating: COMMON_PARAMS.contentRating,
                'order[chapter]': 'desc',
                limit: 500,
                includes: ['scanlation_group'],
            },
        }),
    ]);

    const manga = mapManga(mangaRes.data.data);
    const chapters = chaptersRes.data.data
        .filter((ch) => ch.attributes.pages > 0)
        .map(mapChapter);

    return { ...manga, chapters };
}

export async function mdGetChapterPages(chapterId) {
    const { data } = await mdApi.get(`/at-home/server/${chapterId}`);
    const { baseUrl, chapter } = data;

    const pages = chapter.data.map((file, i) => ({
        index: i + 1,
        url: `${baseUrl}/data/${chapter.hash}/${file}`,
    }));

    return {
        chapterId,
        pages,
        totalPages: pages.length,
        source: 'mangadex',
    };
}

export async function mdSearchManga(query, filters = {}) {
    const page = parseInt(filters.page) || 1;
    const limit = 24;

    const params = {
        ...COMMON_PARAMS,
        limit,
        offset: (page - 1) * limit,
        includes: ['cover_art', 'author'],
    };

    if (query?.trim()) params.title = query.trim();

    if (filters.status) {
        params.status = [filters.status.toLowerCase()];
    }

    if (filters.type) {
        const langMap = { Manga: 'ja', Manhwa: 'ko', Manhua: 'zh' };
        if (langMap[filters.type]) {
            params.originalLanguage = [langMap[filters.type]];
        }
    }

    const { data } = await mdApi.get('/manga', { params });
    return {
        results: data.data.map(mapManga),
        total: data.total,
        totalPages: Math.ceil(data.total / limit),
        currentPage: page,
        source: 'mangadex',
    };
}

export async function mdGetLatestUpdates() {
    const { data } = await mdApi.get('/chapter', {
        params: {
            limit: 15,
            offset: 0,
            'order[readableAt]': 'desc',
            translatedLanguage: ['en'],
            contentRating: ['safe', 'suggestive'],
            includes: ['manga', 'scanlation_group'],
        },
    });

    const mangaIds = [...new Set(data.data.map(ch =>
        ch.relationships.find(r => r.type === 'manga')?.id).filter(Boolean))];

    // To get covers, we need another call or include cover_art in the initial call but /chapter only supports manga include
    // Let's get the manga details with cover_art for these IDs
    const mangaDetailsRes = await mdApi.get('/manga', {
        params: {
            ids: mangaIds,
            includes: ['cover_art'],
            limit: mangaIds.length,
        }
    });

    const mangaMap = {};
    mangaDetailsRes.data.data.forEach(m => {
        mangaMap[m.id] = mapManga(m);
    });

    return data.data.map((ch) => {
        const mangaId = ch.relationships.find(r => r.type === 'manga')?.id;
        const manga = mangaMap[mangaId];
        if (!manga) return null;

        return {
            ...manga,
            latestChapter: {
                id: ch.id,
                number: ch.attributes.chapter,
                title: ch.attributes.title || `Chapter ${ch.attributes.chapter}`,
            },
        };
    }).filter(Boolean);
}