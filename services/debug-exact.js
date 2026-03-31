import axios from 'axios';

async function findExactSlime() {
  try {
    const query = 'That Time I Got Reincarnated as a Slime';
    console.log(`Searching exact title for "${query}"...`);
    const resp = await axios.get(`https://api.mangadex.org/manga`, {
      params: {
        title: query,
        'contentRating[]': ['safe', 'suggestive', 'erotica', 'pornographic'],
        limit: 10
      }
    });
    
    const results = resp.data.data;
    console.log(`Found ${results.length} titles.`);
    for (const r of results) {
       console.log('---');
       console.log('Title (en):', r.attributes.title.en || Object.values(r.attributes.title)[0]);
       console.log('ID:', r.id);
       console.log('Original Language:', r.attributes.originalLanguage);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

findExactSlime();
