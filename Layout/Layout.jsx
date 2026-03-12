export default function ApplicationHTML({
    children, 
    scripts, 
    styles,
    title,
    apiData  
}) {
    return (<html lang='ru'>
        <head>
            <meta charSet='UTF-8' />
            <link rel='icon' href='/static/favicon.ico' />
            <link rel='manifest' href='/static/site.webmanifest' />
            {apiData && <script type='application/json' id='api-data' dangerouslySetInnerHTML={{__html: JSON.stringify(apiData)}} />}
            {(styles || []).map(style => (<link key={style} rel='stylesheet' href={style} />))}
            {(scripts || []).map(scriptPath => (<script type='module' key={scriptPath} defer src={scriptPath} />))}
            {title && <title>{title}</title>}
        </head>
        <body>
            <div id='root'>
                {children}
            </div>
        </body>
    </html>);
}