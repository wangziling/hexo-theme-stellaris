const {Fragment} = require('react')
const CommentsScript = require('./plugins/comments/script.jsx');
const MathJaxScripts = require('./plugins/mathjax/script.jsx');
const generateStellarScript = props => {
    const {theme, __, url_for, page, post} = props
    let outdateMonth = 0
    if (theme.article?.outdated_check.enabled == true) {
      if (post && ('outdate_month' in post)) {
        outdateMonth = post.outdate_month
      } else if (page && ('outdate_month' in page)) {
        outdateMonth = page.outdate_month
      } else {
        outdateMonth = theme.article?.outdated_check?.month || 0
      }
    }

    const stellarPlugins = {
      jQuery: url_for(theme.plugins.jquery || "https://fastly.jsdelivr.net/npm/jquery@latest/dist/jquery.min.js"),
      stellar: theme.plugins.stellar,
      marked: theme.plugins.marked,
      instant_click: theme.plugins.instant_click
    }

    for (const plugin of ['lazyload', 'swiper', 'scrollreveal', 'fancybox', 'copycode']) {
      if (theme.plugins[plugin].enabled) {
        stellarPlugins[plugin] = theme.plugins[plugin]
      }
    }

    const stellarTagPlugins = {}

    for (const tagPlugin of ['bvideo']) {
      if (theme.tag_plugins[tagPlugin].enabled) {
        stellarTagPlugins[tagPlugin] = theme.tag_plugins[tagPlugin]
      }
    }

    let stellarSearch = {}
    if (theme.search.service) {
      stellarSearch = {
        service: theme.search.service,
      }
      if (stellarSearch.service == 'local_search') {
        stellarSearch.js = theme.search.local_search.js
        stellarSearch.path = theme.search.local_search.path
      }
    }

    return `
      stellar = {
        root: '${url_for()}',
        // 懒加载 css https://github.com/filamentgroup/loadCSS
        loadCSS: (href, before, media, attributes) => {
          var doc = window.document;
          var ss = doc.createElement("link");
          var ref;
          if (before) {
            ref = before;
          } else {
            var refs = (doc.body || doc.getElementsByTagName("head")[0]).childNodes;
            ref = refs[refs.length - 1];
          }
          var sheets = doc.styleSheets;
          if (attributes) {
            for (var attributeName in attributes) {
              if (attributes.hasOwnProperty(attributeName)) {
                ss.setAttribute(attributeName, attributes[attributeName]);
              }
            }
          }
          ss.rel = "stylesheet";
          ss.href = href;
          ss.media = "only x";
          function ready(cb) {
            if (doc.body) {
              return cb();
            }
            setTimeout(function () {
              ready(cb);
            });
          }
          ready(function () {
            ref.parentNode.insertBefore(ss, before ? ref : ref.nextSibling);
          });
          var onloadcssdefined = function (cb) {
            var resolvedHref = ss.href;
            var i = sheets.length;
            while (i--) {
              if (sheets[i].href === resolvedHref) {
                return cb();
              }
            }
            setTimeout(function () {
              onloadcssdefined(cb);
            });
          };
          function loadCB() {
            if (ss.addEventListener) {
              ss.removeEventListener("load", loadCB);
            }
            ss.media = media || "all";
          }
          if (ss.addEventListener) {
            ss.addEventListener("load", loadCB);
          }
          ss.onloadcssdefined = onloadcssdefined;
          onloadcssdefined(loadCB);
          return ss;
        },
        // 从 butterfly 和 volantis 获得灵感
        loadScript: (src, opt) => new Promise((resolve, reject) => {
          var script = document.createElement('script');
          script.src = src;
          if (opt) {
            for (let key of Object.keys(opt)) {
              script[key] = opt[key]
            }
          } else {
            // 默认异步，如果需要同步，第二个参数传入 {} 即可
            script.async = true
          }
          script.onerror = reject
          script.onload = script.onreadystatechange = function() {
            const loadState = this.readyState
            if (loadState && loadState !== 'loaded' && loadState !== 'complete') return
            script.onload = script.onreadystatechange = null
            resolve()
          }
          document.head.appendChild(script)
        }),
    
        // https://github.com/jerryc127/hexo-theme-butterfly
        jQuery: fn => stellaris.jQuery(fn)
      };
      stellar.github = 'https://github.com/chiyuki0325/hexo-theme-stellaris';
      stellar.config = {
        date_suffix: {
          just: '${__('meta.date_suffix.just')}',
          min: '${__('meta.date_suffix.min')}',
          hour: '${__('meta.date_suffix.hour')}',
          day: '${__('meta.date_suffix.day')}',
          month: '${__('meta.date_suffix.month')}',
        },
      };
    
      stellar.plugins = Object.assign(${JSON.stringify(stellarPlugins)})
      stellar.tag_plugins = Object.assign(${JSON.stringify(stellarTagPlugins)})
      stellar.search = Object.assign(${JSON.stringify(stellarSearch)})

      stellar.article = {
        outdate_month: ${outdateMonth}
      };
    `;
}

const ImportJS = props => {
    const {theme, url_for} = props
    let stellarJsUrl
    if (theme.stellar && theme.stellar.cdn_js) {
        stellarJsUrl = theme.stellar.cdn_js
    } else {
        stellarJsUrl = require("path").join(url_for(), '/js/main.js')
    }
    return <script src={stellarJsUrl} type="text/javascript" async={true} data-no-instant="true"/>
}

const InjectScripts = props => {
    let scripts = []
    const {theme} = props
    if (theme.inject && theme.inject.script && theme.inject.script.length > 0) {
        const parse = require('html-react-parser').default
        let i = 0
        for (const script of theme.inject.script) {
            scripts.push(
                <Fragment key={String(i)}>{parse(script)}</Fragment>
            )
            i++
        }
    }
    return <>
        {scripts}
    </>
}

const Scripts = props => {
    const {join} = require("path")
    const {theme, page, url_for} = props
    return (
        <div className="scripts">
            <script src={theme.plugins.instant_click.js} data-no-instant="true"/>
            <script data-no-instant="true" type="text/javascript">
                {"InstantClick.init();"}
            </script>
            <script type="text/javascript" dangerouslySetInnerHTML={{__html: generateStellarScript(props)}}/>
            <ImportJS {...props}/>
            <script type="text/javascript" src={join(url_for(), "/js/check_outdated_browser.js")} data-no-instant="true"/>
            <CommentsScript {...props}/>
            {(() => {
                 if (theme.plugins.mathjax.per_page === true || page.mathjax === true) return (<MathJaxScripts {...props}/>)
            })()}

            <InjectScripts {...props} />
        </div>
    )
}

module.exports = Scripts
