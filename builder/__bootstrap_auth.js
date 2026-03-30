import { createElement } from 'react';
import { createRoot } from 'react-dom/client';

async function startApplication() {
    const [AppCore, SiteApp, Auth] = await Promise.all([
            import('./AppCore.js'),
            import('./SiteApp.js'),
            import('./Auth.js')  
        ]), 
        root = createRoot(document.getElementById('root'));
    root.render(createElement(AppCore.default,  {},  createElement(SiteApp.default, {}, createElement(Auth.default))));
}
startApplication();