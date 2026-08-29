export const prerender = true;

// No trailingSlash override: the default ('never') prerenders the writeup to
// build/writeups/hybrid-retrieval.html — byte-identical to the URL already in
// sitemap.xml and live today. 'always' would move it to .../index.html and
// break that canonical URL.
