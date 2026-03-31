import axios from 'axios';

async function checkSlimeFeed() {
  try {
    const id = 'e78a489b-6632-4d61-b00b-5206f5b8b22b';
    console.log(`Fetching feed for Slime Manga (${id})...`);
    
    // First, check WITHOUT language filter
    console.log('\n--- Checking ALL languages ---');
    const respAll = await axios.get(`https://api.mangadex.org/manga/${id}/feed`, {
      params: { limit: 5 }
    });
    console.log(`Found ${respAll.data.total} total chapters across all languages.`);
    if (respAll.data.data.length > 0) {
       console.log('Sample format:', respAll.data.data[0].attributes.translatedLanguage);
    }

    // Second, check WITH English filter
    console.log('\n--- Checking ENGLISH only ---');
    const respEn = await axios.get(`https://api.mangadex.org/manga/${id}/feed`, {
      params: { 
          limit: 5,
          translatedLanguage: ['en']
      }
    });
    console.log(`Found ${respEn.data.total} English chapters.`);
    if (respEn.data.data.length > 0) {
       console.log('Sample Chapter:', respEn.data.data[0].attributes.chapter);
       console.log('External URL:', respEn.data.data[0].attributes.externalUrl);
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkSlimeFeed();
