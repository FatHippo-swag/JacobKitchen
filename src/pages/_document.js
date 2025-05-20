import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head>
        {/* MS Sans Serif font for Windows 98 look */}
        <link href="https://fonts.cdnfonts.com/css/ms-sans-serif" rel="stylesheet" />
        
        {/* Classic meta tags for that retro feel */}
        <meta name="description" content="Welcome to my webcore painting app! Best viewed in Internet Explorer 6.0+" />
        <meta name="keywords" content="webcore, 90s, retro, ms paint, notepad, windows 98, drawing, art" />
        <meta name="author" content="WebcoreDev" />
        <meta name="generator" content="Notepad" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        
        {/* Old school favicon */}
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}