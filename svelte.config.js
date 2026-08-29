import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
export default {
  kit: {
    // fallback: undefined => fully prerendered multi-page site (not an SPA)
    adapter: adapter({ fallback: undefined }),
    paths: {
      base: '/Bio',
      // absolute "/Bio/..." URLs: the deploy target is fixed, and GitHub Pages
      // serves the writeup at both /Bio/writeups/x.html and /Bio/writeups/x —
      // relative paths would resolve differently between those two forms.
      relative: false
    }
  }
};
