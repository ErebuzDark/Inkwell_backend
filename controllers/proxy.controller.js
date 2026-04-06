import axios from 'axios';

/**
 * Proxy a stream request with custom headers
 * Handles M3U8 manifest rewriting to ensure segments also go through the proxy.
 */
export const proxyStream = async (req, res) => {
  const { url, headers: customHeadersStr } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing target URL' });
  }

  try {
    let headers = {};
    if (customHeadersStr) {
      try {
        headers = JSON.parse(Buffer.from(customHeadersStr, 'base64').toString());
      } catch (e) {
        console.warn('Failed to parse proxy headers:', e);
      }
    }

    // Default User-Agent to a common desktop one to avoid mobile-specific blocks
    if (!headers['User-Agent'] && !headers['user-agent']) {
      headers['user-agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
    }

    // Auto-set Referer if missing to match the target domain
    if (!headers['Referer'] && !headers['referer']) {
      try {
        const targetUrl = new URL(decodeURIComponent(url));
        headers['referer'] = targetUrl.origin + '/';
      } catch (e) {}
    }

    // Forward Range header from client to support seeking
    if (req.headers.range) {
      headers['Range'] = req.headers.range;
    }

    const response = await axios({
      method: 'get',
      url: decodeURIComponent(url),
      headers: headers,
      responseType: 'stream',
      timeout: 15000,
      maxRedirects: 5,
    });

    const contentType = response.headers['content-type'];
    res.setHeader('Content-Type', contentType || 'application/octet-stream');
    
    // Copy essential cache and streaming headers from source
    if (response.headers['cache-control']) res.setHeader('Cache-Control', response.headers['cache-control']);
    if (response.headers['expires']) res.setHeader('Expires', response.headers['expires']);
    if (response.headers['content-length']) res.setHeader('Content-Length', response.headers['content-length']);
    if (response.headers['accept-ranges']) res.setHeader('Accept-Ranges', response.headers['accept-ranges']);
    if (response.headers['content-range']) res.setHeader('Content-Range', response.headers['content-range']);
    
    // If it's a partial content response, return 206
    if (response.status === 206) {
       res.status(206);
    }

    // Handle M3U8 rewriting (Playlist Manifests)
    if (contentType && (contentType.includes('mpegurl') || contentType.includes('x-mpegURL') || url.includes('.m3u8'))) {
      let manifest = '';
      response.data.on('data', chunk => { manifest += chunk.toString(); });
      response.data.on('end', () => {
        const baseUrl = new URL(url).origin + new URL(url).pathname.substring(0, new URL(url).pathname.lastIndexOf('/') + 1);
        
        // Rewrite lines that are URLs (don't start with #)
        const lines = manifest.split('\n');
        const rewrittenLines = lines.map(line => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) return line;
          
          // Resolve relative URLs to absolute
          let absoluteUrl = trimmed;
          if (!trimmed.startsWith('http')) {
             absoluteUrl = new URL(trimmed, baseUrl).href;
          }
          
          // Encode back into this proxy endpoint
          const proxyUrl = `${req.protocol}://${req.get('host')}/api/proxy?url=${encodeURIComponent(absoluteUrl)}&headers=${customHeadersStr || ''}`;
          return proxyUrl;
        });
        
        res.send(rewrittenLines.join('\n'));
      });
    } else {
      // Direct binary streaming (Segments .ts, images, etc.)
      response.data.pipe(res);
    }

  } catch (error) {
    console.error('Proxy Error:', error.message);
    if (error.response) {
      res.status(error.response.status).send(error.response.data);
    } else {
      res.status(500).json({ error: 'Proxy Request Failed', details: error.message });
    }
  }
};
