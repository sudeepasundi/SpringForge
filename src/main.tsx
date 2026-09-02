import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { MDXProvider } from '@mdx-js/react';
import { App } from '@/app/App';
import { mdxComponents } from '@/lib/mdx-components';
import '@/styles/index.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element missing from index.html');

createRoot(container).render(
  <StrictMode>
    {/* Hash routing keeps deep links working on any static host, and when the
        built output is opened straight from disk. */}
    <HashRouter>
      <MDXProvider components={mdxComponents}>
        <App />
      </MDXProvider>
    </HashRouter>
  </StrictMode>,
);
