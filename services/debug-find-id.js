import axios from 'axios';

async function findDefinitiveSlime() {
  try {
    console.log(`Searching for the definitive Slime manga...`);
    // 'Tensei Shitara Slime Datta Ken' is the exact romaji
    const resp = await axios.get(`https://api.mangadex.org/manga`, {
      params: {
        title: 'Tensei Shitara Slime Datta Ken',
        'contentRating[]': ['safe', 'suggestive'],
        'includes[]': ['author', 'artist'],
        limit: 5,
        'order[relevance]': 'desc'
      }
    });
    
    const results = resp.data.data;
    for (const r of results) {
       console.log('---');
       console.log('ID:', r.id);
       console.log('Title (en/ja):', r.attributes.title.en || r.attributes.title['ja-ro']);
       console.log('Status:', r.attributes.status);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

findDefinitiveSlime();
