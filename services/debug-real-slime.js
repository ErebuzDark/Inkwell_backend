import { mdGetMangaDetail } from './mangadex.service.js';

async function checkRealSlime() {
  try {
    // Known ID for the main Tensei Slime manga
    const realSlimeId = 'eb2d1a45-d4e7-4e32-a171-b5b029c5b0cb';
    console.log('Fetching details for Main Slime Manga...');
    const data = await mdGetMangaDetail(realSlimeId);
    console.log('Title:', data.title);
    console.log('Chapters found:', data.chapters.length);
    if (data.chapters.length > 0) {
      console.log('Sample Chapter:', data.chapters[0].title);
      console.log('External?', !!data.chapters[0].externalUrl);
    } else {
      console.log('No chapters found in English feed.');
    }
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
}

checkRealSlime();
