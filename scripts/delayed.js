// eslint-disable-next-line import/no-cycle
import {loadScript, sampleRUM} from './lib-franklin.js';

const GTM_SCRIPT = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','GTM-MNF423K');`

function createInlineScript(innerHTML, parent) {
  const script = document.createElement('script');
  script.innerHTML = innerHTML;
  parent.appendChild(script);
}

// Core Web Vitals RUM collection
sampleRUM('cwv');

// add more delayed functionality here
createInlineScript(GTM_SCRIPT, document.body);
