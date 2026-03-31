import { mdGetMangaDetail } from './mangadex.service.js';

async function debugSlime() {
  try {
    const slimeId = 'e404327e-ae1c-4dae-ab0a-509f63238ca7';
    console.log('Fetching details for Slime...');
    const data = await mdGetMangaDetail(slimeId);
    console.log('Title:', data.title);
    console.log('Chapters found:', data.chapters.length);
    if (data.chapters.length > 0) {
      console.log('Sample Chapter:', data.chapters[0]);
    } else {
      console.log('No chapters found in English feed.');
    }
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
}

debugSlime();
