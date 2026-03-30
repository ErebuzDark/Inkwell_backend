import { mdGetMangaDetail } from './mangadex.service.js';

async function test() {
  try {
    const id = 'e1e38166-20e4-4468-9370-187f985c550e'; // Sono Bisque Doll
    const data = await mdGetMangaDetail(id);
    console.log('Success:', data.title, data.chapters.length, 'chapters');
  } catch (err) {
    console.error('Error:', err.message);
    if (err.response) {
      console.error('Response:', err.response.data);
    }
  }
}

test();
