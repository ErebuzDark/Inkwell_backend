import { mdGetMangaDetail } from './mangadex.service.js';

async function test() {
  try {
    const id = 'e1e38166-20e4-4468-9370-187f985c550e'; // Sono Bisque Doll
    const data = await mdGetMangaDetail(id);
    console.log('Success:', data.title);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
}

test();
