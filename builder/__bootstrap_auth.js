import { createElement } from 'react';
import { hydrateRoot } from 'react-dom/client';

async function hydrateApplication() {
    const [AppCore, Auth] = await Promise.all([
            import('./AppCore.js'),
            import('./Auth.js')  
        ]);
    hydrateRoot(
        document.getElementById('root'),
        createElement(
            AppCore.default, 
            {}, 
            createElement(Auth.default, 
                {}
            )
        )
    );
}
hydrateApplication();