import { mdSearchManga, mdGetMangaDetail } from './mangadex.service.js';

async function searchJapaneseSlime() {
  try {
    const query = 'Tensei Shitara Slime Datta Ken';
    console.log(`Searching for "${query}"...`);
    const data = await mdSearchManga(query);
    const results = data.results || [];
    console.log(`Found ${results.length} results.`);
    
    for (const res of results.slice(0, 5)) {
      console.log('---');
      console.log('Result:', res.title, `(${res.id})`);
      const details = await mdGetMangaDetail(res.id);
      console.log('Chapters:', details.chapters.length);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

searchJapaneseSlime();
