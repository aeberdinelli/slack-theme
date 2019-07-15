# Why?
Slack is awesome. However, it does not support a lot of customization, by default you can change only the sidebar colors. Using this, you will install a dark theme that looks really, really nice.

## Screenshot
![screenshot 1](https://raw.githubusercontent.com/aeberdinelli/slack-theme/master/screenshots/1.png)

## Install on Windows
Download and install the latest version from here. https://github.com/aeberdinelli/slack-theme/releases/download/v1.0/slack-theme.exe

## Install manually
You need to patch slack, you can do it like this:

1. Close slack completely. Then, find out where slack is installed. By default on Windows, it will be in `C:\Users\your_username\AppData\Local\slack`.
2. Inside your slack folder, go into `resources/app.asar.unpacked/src/static/` and open `ssb-interop.js` with a text editor.
3. Put the following contents at the end of that file:

```javascript
document.addEventListener("DOMContentLoaded", function() {
   let webviews = document.querySelectorAll(".TeamView webview");

   const cssPath = 'https://raw.githubusercontent.com/aeberdinelli/slack-theme/master/static/index.css';
   
   let cssPromise = fetch(cssPath).then(response => response.text());

   let customCustomCSS = `
   :root {
      /* Modify these to change your theme colors: */
     --primary: #32353b;
     --accent: #568AF2;
     --text: #ABB2BF;
     --background: #282C34;
     --background-elevated: #282C34;

     /* These should be less important: */
     --background-hover: #232529;
     --background-light: #AAA;
     --background-bright: #FFF;

     --border-dim: #666;
     --border-bright: var(--primary);

     --text-bright: #FFF;
     --text-dim: #555c69;
     --text-special: #56b6c2;
     --text-accent: var(--text-bright);

     --scrollbar-background: #000;
     --scrollbar-border: var(--primary);

     --yellow: #fc0;
     --green: #98C379;
     --cyan: #56B6C2;
     --blue: #61AFEF;
     --purple: #C678DD;
     --red: #E06C75;
     --red2: #BE5046;
     --orange: #D19A66;
     --orange2: #E5707B;
     --gray: #3E4451;
     --silver: #9da5b4;
     --black: #21252b;
      }
   `

   // Insert a style tag into the wrapper view
   cssPromise.then(css => {
      let s = document.createElement('style');
      s.type = 'text/css';
      s.innerHTML = css + customCustomCSS;
      document.head.appendChild(s);
   });

   // Wait for each webview to load
   webviews.forEach(webview => {
      webview.addEventListener('ipc-message', message => {
         if (message.channel == 'didFinishLoading')
            // Finally add the CSS into the webview
            cssPromise.then(css => {
               let script = `
                     let s = document.createElement('style');
                     s.type = 'text/css';
                     s.id = 'slack-custom-css';
                     s.innerHTML = \`${css + customCustomCSS}\`;
                     document.head.appendChild(s);
                     `
               webview.executeJavaScript(script);
            })
      });
   });
});
```

4. Is a good idea to backup the file once you updated it so you can easily re-apply the changes if slack changes it while updating the app.

## Develop
You can run a local webserver so the script you updated works with local changes:

1. Install NodeJS >= 10
2. Clone this repository: `git clone https://github.com/aeberdinelli/slack-theme.git`
3. Install dependencies: `cd slack-theme && npm install`
4. Run the webserver: `npm start`
5. Finally, update your slack file so it request your local file instead of the one in the repository, open from your slack folder `resources/app.asar.unpacked/src/static/ssb-interop.js` and change:

`-` `const cssPath = 'https://raw.githubusercontent.com/aeberdinelli/slack-theme/master/static/index.css';` <br />
`+` `const cssPath = 'http://localhost:8500/index.css';`
