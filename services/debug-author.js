import axios from 'axios';

async function findSlimeByAuthor() {
  try {
    const authorId = '929c299c-d089-4be2-ba00-80a5f98cfb88'; // Fuse
    console.log(`Searching for manga by author ID ${authorId}...`);
    const resp = await axios.get(`https://api.mangadex.org/manga`, {
      params: {
        'authors[]': [authorId],
        'contentRating[]': ['safe', 'suggestive', 'erotica', 'pornographic']
      }
    });
    
    const results = resp.data.data;
    console.log(`Found ${results.length} titles.`);
    for (const r of results) {
       console.log('---');
       console.log('Title (en):', r.attributes.title.en || Object.values(r.attributes.title)[0]);
       console.log('ID:', r.id);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

findSlimeByAuthor();
