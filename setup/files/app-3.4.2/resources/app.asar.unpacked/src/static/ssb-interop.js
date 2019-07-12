/**
 * The preload script needs to stay in regular ole JavaScript, because it is
 * the point of entry for electron-compile.
 */

const allowedChildWindowEventMethod = [
  'windowWithTokenBeganLoading',
  'windowWithTokenFinishedLoading',
  'windowWithTokenCrashed',
  'windowWithTokenDidChangeGeometry',
  'windowWithTokenBecameKey',
  'windowWithTokenResignedKey',
  'windowWithTokenWillClose'
];

if (window.location.href !== 'about:blank') {
  const preloadStartTime = process.hrtime();

  require('./assign-metadata').assignMetadata();
  if (window.parentWebContentsId) {
    //tslint:disable-next-line:no-console max-line-length
    const warn = () => console.warn(`Deprecated: direct access to global object 'parentInfo' will be disallowed. 'parentWebContentsId' will be available until new interface is ready.`);
    Object.defineProperty(window, 'parentInfo', {
      get: () => {
        warn();
        return {
          get webContentsId() {
            warn();
            return parentWebContentsId;
          }
        };
      }
    });
  }

  const { ipcRenderer, remote } = require('electron');

  ipcRenderer
    .on('SLACK_NOTIFY_CHILD_WINDOW_EVENT', (event, method, ...args) => {
      try {
        if (!window.desktop ||
          !desktop.delegate ||
          !desktop.delegate[method]) {
          return;
        }

        if (!allowedChildWindowEventMethod.includes(method)) {
          throw new Error('Unsupported method');
        }

        desktop.delegate[method](...args);
      } catch (error) {
        console.error(`Cannot execute method`, { error, method }); //tslint:disable-line:no-console
      }
    });

  ipcRenderer
    .on('SLACK_REMOTE_DISPATCH_EVENT', (event, data, origin, browserWindowId) => {
      const evt = new Event('message');
      evt.data = JSON.parse(data);
      evt.origin = origin;
      evt.source = {
        postMessage: (message) => {
          if (!desktop || !desktop.window || !desktop.window.postMessage) throw new Error('desktop not ready');
          return desktop.window.postMessage(message, browserWindowId);
        }
      };

      window.dispatchEvent(evt);
      event.sender.send('SLACK_REMOTE_DISPATCH_EVENT');
    });

  const { init } = require('electron-compile');
  const { assignIn } = require('lodash');
  const path = require('path');

  const { isPrebuilt } = require('../utils/process-helpers');

  //tslint:disable-next-line:no-console
  process.on('uncaughtException', (e) => console.error(e));

  /**
   * Patch Node.js globals back in, refer to
   * https://electron.atom.io/docs/api/process/#event-loaded.
   */
  const processRef = window.process;

  process.once('loaded', () => {
    const safeProcessKeys = [ 'title', 'version', 'versions', 'arch', 'platform',
      'release', 'env', 'pid', 'features', 'execPath', 'cwd', 'hrtime', 'uptime',
      'memoryUsage', 'type', 'resourcesPath', 'helperExecPath', 'nextTick',
      'getProcessMemoryInfo', 'getSystemMemoryInfo', 'windowsStore' ];

    const safeProcess = safeProcessKeys.reduce((acc, k) => {
      if (typeof (processRef[k]) !== 'function') {
        acc[k] = processRef[k];
        return acc;
      }

      acc[k] = (...args) => processRef[k](...args);
      return acc;
    }, {});

    window.process = safeProcess;
  });

  window.perfTimer.PRELOAD_STARTED = preloadStartTime;

  // Consider "initial team booted" as whether the workspace is the first loaded after Slack launches
  ipcRenderer.once('SLACK_PRQ_TEAM_BOOT_ORDER', (_event, order) => {
    window.perfTimer.isInitialTeamBooted = order === 1;
  });
  ipcRenderer.send('SLACK_PRQ_TEAM_BOOTED'); // Main process will respond SLACK_PRQ_TEAM_BOOT_ORDER

  const resourcePath = path.join(__dirname, '..', '..');
  const mainModule = require.resolve('../ssb/main.ts');
  const isDevMode = loadSettings.devMode && isPrebuilt();

  init(resourcePath, mainModule, !isDevMode);
}

// First make sure the wrapper app is loaded
document.addEventListener("DOMContentLoaded", function() {

   // Then get its webviews
   let webviews = document.querySelectorAll(".TeamView webview");

   // Fetch our CSS in parallel ahead of time
   
   const cssPath = 'https://raw.githubusercontent.com/aeberdinelli/slack-theme/master/static/index.css';
   //const cssPath = 'http://localhost:8500/index.css';
   
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