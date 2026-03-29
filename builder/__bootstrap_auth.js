import { createElement } from 'react';
import { createRoot } from 'react-dom/client';

async function startApplication() {
    const [AppCore, Auth] = await Promise.all([
            import('./AppCore.js'),
            import('./Auth.js')  
        ]), 
        root = createRoot(document.getElementById('root'));
    root.render(createElement(AppCore.default,  {},  createElement(Auth.default)));
}
startApplication();