/*
 * Embed Block
 * Show videos and social posts directly on your page
 * https://www.hlx.live/developer/block-collection/embed
 */

const loadScript = (url, callback, type) => {
    const head = document.querySelector('head');
    const script = document.createElement('script');
    script.src = url;
    if (type) {
      script.setAttribute('type', type);
    }
    script.onload = callback;
    head.append(script);
    return script;
  };
  
  const getDefaultEmbed = (url) => `<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
      <iframe src="${url.href}" style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;" allowfullscreen=""
        scrolling="no" allow="encrypted-media" title="Content from ${url.hostname}" loading="lazy">
      </iframe>
    </div>`;
  
  const embedYoutube = (url, autoplay) => {
    const usp = new URLSearchParams(url.search);
    const suffix = autoplay ? '&muted=1&autoplay=1' : '';
    let vid = usp.get('v') ? encodeURIComponent(usp.get('v')) : '';
    const embed = url.pathname;
    if (url.origin.includes('youtu.be')) {
      [, vid] = url.pathname.split('/');
    }
    const embedHTML = `<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
        <iframe src="https://www.youtube.com${vid ? `/embed/${vid}?rel=0&v=${vid}${suffix}` : embed}" style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;" 
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope; picture-in-picture" allowfullscreen="" scrolling="no" title="Content from Youtube" loading="lazy"></iframe>
      </div>`;
    return embedHTML;
  };
  
  const embedVimeo = (url, autoplay) => {
    const [, video] = url.pathname.split('/');
    const suffix = autoplay ? '?muted=1&autoplay=1' : '';
    const embedHTML = `<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
        <iframe src="https://player.vimeo.com/video/${video}${suffix}" 
        style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;" 
        frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen  
        title="Content from Vimeo" loading="lazy"></iframe>
      </div>`;
    return embedHTML;
  };
  
  const embedTwitter = (url) => {
    const embedHTML = `<blockquote class="twitter-tweet"><a href="${url.href}"></a></blockquote>`;
    loadScript('https://platform.twitter.com/widgets.js');
    return embedHTML;
  };

  const embedSurveryMonky =(jsScript) =>{
    
    try{
        const embedHTML = smScript(jsScript);
        return embedHTML;
    }catch (error) {
        console.error('Error executing script:', error);
      }
   

  }
  function smScript(jsUrl){
   
(function(t,e,s,n){ 
    var o,a,c; 
    t.SMCX=t.SMCX||[],
    e.getElementById(n)||
    (o=e.getElementsByTagName(s),
    a=o[o.length-1], 
    
    c=e.createElement(s), 
    
    c.type="text/javascript", 
    
    c.async = true,
    
    c.id=n, 
    
    c.src= jsUrl.replace(/\s/g, ''), 
    
   a.parentNode.insertBefore(c,a)
  
   )})(window,document,"script","smcx-sdk"); 
  
  }
  
  const loadEmbed = (block, link, autoplay) => {
    if (block.classList.contains('embed-is-loaded')) {
      return;
    }
  
    const EMBEDS_CONFIG = [
      {
        match: ['youtube', 'youtu.be'],
        embed: embedYoutube,
      },
      {
        match: ['vimeo'],
        embed: embedVimeo,
      },
      {
        match: ['twitter'],
        embed: embedTwitter,
      },
    ];
  
    const config = EMBEDS_CONFIG.find((e) => e.match.some((match) => link.includes(match)));
    const url = new URL(link);
    if (config) {
      block.innerHTML = config.embed(url, autoplay);
      block.classList = `block embed embed-${config.match[0]}`;
    } else {
      block.innerHTML = getDefaultEmbed(url);
      block.classList = 'block embed';
    }
    block.classList.add('embed-is-loaded');
  };


  const loadEmbedScript = (block, jsScript) =>{
    if (block.classList.contains('embed-is-loaded')) {
        return;
      }else{
      block.classList = `block embed embed-surveymonkey`;
      block.classList.add('block','embed', `embed-surveymonkey`); 

      block.innerHTML = embedSurveryMonky(jsScript );
      
      block.classList.add('embed-is-loaded');
    }

  };
  
  export default function decorate(block) {

    if (block.textContent.includes('surveymonkey')) {
        var jsScript = block.outerHTML.replace(/<div[^>]*>|<\/?p>|&lt;script&gt;|&lt;\/script&gt;/g, '');
        jsScript =  jsScript.replace(/<\/div>\s*/g, '');
       // jsScript = jsScript.replace(/[\n\s"]+/g, '');
            loadEmbedScript(block,jsScript);


    }else{
        const placeholder = block.querySelector('picture');
        const link = block.querySelector('a').href;
        block.textContent = '';
  
    if (placeholder) {
      const wrapper = document.createElement('div');
      wrapper.className = 'embed-placeholder';
      wrapper.innerHTML = '<div class="embed-placeholder-play"><button type="button" title="Play"></button></div>';
      wrapper.prepend(placeholder);
      wrapper.addEventListener('click', () => {
        loadEmbed(block, link, true);
      });
      block.append(wrapper);
    } else {
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect();
          loadEmbed(block, link);
        }
      });
      observer.observe(block);
    }
}
       


  }
  export async function loadLazy() {
    setTimeout(function() {
        // Survey Monkey block will be shifted up after 5 milliseconds
        var className = 'embed-surveymonkey';
        var element = document.getElementsByClassName(className)[0];
        element.innerHTML ="";
        var srcElement = document.getElementsByClassName("smcx-widget smcx-embed ")[0]; 
        element.appendChild(srcElement) ;
    }, 10);
  }
  

  


