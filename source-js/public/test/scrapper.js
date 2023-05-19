(function() {
    const env = {"BASE_URI":"__PROXY__"};
    try {
        if (process) {
            process.env = Object.assign({}, process.env);
            Object.assign(process.env, env);
            return;
        }
    } catch (e) {} // avoid ReferenceError: process is not defined
    globalThis.process = { env:env };
})();

function parseQuery(query) {
  var chunks = query.split(/([#.])/);
  var tagName = '';
  var id = '';
  var classNames = [];

  for (var i = 0; i < chunks.length; i++) {
    var chunk = chunks[i];

    if (chunk === '#') {
      id = chunks[++i];
    } else if (chunk === '.') {
      classNames.push(chunks[++i]);
    } else if (chunk.length) {
      tagName = chunk;
    }
  }

  return {
    tag: tagName || 'div',
    id: id,
    className: classNames.join(' ')
  };
}

function createElement(query, ns) {
  var ref = parseQuery(query);
  var tag = ref.tag;
  var id = ref.id;
  var className = ref.className;
  var element = ns ? document.createElementNS(ns, tag) : document.createElement(tag);

  if (id) {
    element.id = id;
  }

  if (className) {
    if (ns) {
      element.setAttribute('class', className);
    } else {
      element.className = className;
    }
  }

  return element;
}

function doUnmount(child, childEl, parentEl) {
  var hooks = childEl.__redom_lifecycle;

  if (hooksAreEmpty(hooks)) {
    childEl.__redom_lifecycle = {};
    return;
  }

  var traverse = parentEl;

  if (childEl.__redom_mounted) {
    trigger(childEl, 'onunmount');
  }

  while (traverse) {
    var parentHooks = traverse.__redom_lifecycle || {};

    for (var hook in hooks) {
      if (parentHooks[hook]) {
        parentHooks[hook] -= hooks[hook];
      }
    }

    if (hooksAreEmpty(parentHooks)) {
      traverse.__redom_lifecycle = null;
    }

    traverse = traverse.parentNode;
  }
}

function hooksAreEmpty(hooks) {
  if (hooks == null) {
    return true;
  }

  for (var key in hooks) {
    if (hooks[key]) {
      return false;
    }
  }

  return true;
}
/* global Node, ShadowRoot */


var hookNames = ['onmount', 'onremount', 'onunmount'];
var shadowRootAvailable = typeof window !== 'undefined' && 'ShadowRoot' in window;

function mount(parent, child, before, replace) {
  var parentEl = getEl(parent);
  var childEl = getEl(child);

  if (child === childEl && childEl.__redom_view) {
    // try to look up the view if not provided
    child = childEl.__redom_view;
  }

  if (child !== childEl) {
    childEl.__redom_view = child;
  }

  var wasMounted = childEl.__redom_mounted;
  var oldParent = childEl.parentNode;

  if (wasMounted && oldParent !== parentEl) {
    doUnmount(child, childEl, oldParent);
  }

  if (before != null) {
    if (replace) {
      parentEl.replaceChild(childEl, getEl(before));
    } else {
      parentEl.insertBefore(childEl, getEl(before));
    }
  } else {
    parentEl.appendChild(childEl);
  }

  doMount(child, childEl, parentEl, oldParent);
  return child;
}

function trigger(el, eventName) {
  if (eventName === 'onmount' || eventName === 'onremount') {
    el.__redom_mounted = true;
  } else if (eventName === 'onunmount') {
    el.__redom_mounted = false;
  }

  var hooks = el.__redom_lifecycle;

  if (!hooks) {
    return;
  }

  var view = el.__redom_view;
  var hookCount = 0;
  view && view[eventName] && view[eventName]();

  for (var hook in hooks) {
    if (hook) {
      hookCount++;
    }
  }

  if (hookCount) {
    var traverse = el.firstChild;

    while (traverse) {
      var next = traverse.nextSibling;
      trigger(traverse, eventName);
      traverse = next;
    }
  }
}

function doMount(child, childEl, parentEl, oldParent) {
  var hooks = childEl.__redom_lifecycle || (childEl.__redom_lifecycle = {});
  var remount = parentEl === oldParent;
  var hooksFound = false;

  for (var i = 0, list = hookNames; i < list.length; i += 1) {
    var hookName = list[i];

    if (!remount) {
      // if already mounted, skip this phase
      if (child !== childEl) {
        // only Views can have lifecycle events
        if (hookName in child) {
          hooks[hookName] = (hooks[hookName] || 0) + 1;
        }
      }
    }

    if (hooks[hookName]) {
      hooksFound = true;
    }
  }

  if (!hooksFound) {
    childEl.__redom_lifecycle = {};
    return;
  }

  var traverse = parentEl;
  var triggered = false;

  if (remount || traverse && traverse.__redom_mounted) {
    trigger(childEl, remount ? 'onremount' : 'onmount');
    triggered = true;
  }

  while (traverse) {
    var parent = traverse.parentNode;
    var parentHooks = traverse.__redom_lifecycle || (traverse.__redom_lifecycle = {});

    for (var hook in hooks) {
      parentHooks[hook] = (parentHooks[hook] || 0) + hooks[hook];
    }

    if (triggered) {
      break;
    } else {
      if (traverse.nodeType === Node.DOCUMENT_NODE || shadowRootAvailable && traverse instanceof ShadowRoot || parent && parent.__redom_mounted) {
        trigger(traverse, remount ? 'onremount' : 'onmount');
        triggered = true;
      }

      traverse = parent;
    }
  }
}

function setStyle(view, arg1, arg2) {
  var el = getEl(view);

  if (typeof arg1 === 'object') {
    for (var key in arg1) {
      setStyleValue(el, key, arg1[key]);
    }
  } else {
    setStyleValue(el, arg1, arg2);
  }
}

function setStyleValue(el, key, value) {
  if (value == null) {
    el.style[key] = '';
  } else {
    el.style[key] = value;
  }
}
/* global SVGElement */


var xlinkns = 'http://www.w3.org/1999/xlink';

function setAttrInternal(view, arg1, arg2, initial) {
  var el = getEl(view);
  var isObj = typeof arg1 === 'object';

  if (isObj) {
    for (var key in arg1) {
      setAttrInternal(el, key, arg1[key], initial);
    }
  } else {
    var isSVG = el instanceof SVGElement;
    var isFunc = typeof arg2 === 'function';

    if (arg1 === 'style' && typeof arg2 === 'object') {
      setStyle(el, arg2);
    } else if (isSVG && isFunc) {
      el[arg1] = arg2;
    } else if (arg1 === 'dataset') {
      setData(el, arg2);
    } else if (!isSVG && (arg1 in el || isFunc) && arg1 !== 'list') {
      el[arg1] = arg2;
    } else {
      if (isSVG && arg1 === 'xlink') {
        setXlink(el, arg2);
        return;
      }

      if (initial && arg1 === 'class') {
        arg2 = el.className + ' ' + arg2;
      }

      if (arg2 == null) {
        el.removeAttribute(arg1);
      } else {
        el.setAttribute(arg1, arg2);
      }
    }
  }
}

function setXlink(el, arg1, arg2) {
  if (typeof arg1 === 'object') {
    for (var key in arg1) {
      setXlink(el, key, arg1[key]);
    }
  } else {
    if (arg2 != null) {
      el.setAttributeNS(xlinkns, arg1, arg2);
    } else {
      el.removeAttributeNS(xlinkns, arg1, arg2);
    }
  }
}

function setData(el, arg1, arg2) {
  if (typeof arg1 === 'object') {
    for (var key in arg1) {
      setData(el, key, arg1[key]);
    }
  } else {
    if (arg2 != null) {
      el.dataset[arg1] = arg2;
    } else {
      delete el.dataset[arg1];
    }
  }
}

function text(str) {
  return document.createTextNode(str != null ? str : '');
}

function parseArgumentsInternal(element, args, initial) {
  for (var i = 0, list = args; i < list.length; i += 1) {
    var arg = list[i];

    if (arg !== 0 && !arg) {
      continue;
    }

    var type = typeof arg;

    if (type === 'function') {
      arg(element);
    } else if (type === 'string' || type === 'number') {
      element.appendChild(text(arg));
    } else if (isNode(getEl(arg))) {
      mount(element, arg);
    } else if (arg.length) {
      parseArgumentsInternal(element, arg, initial);
    } else if (type === 'object') {
      setAttrInternal(element, arg, null, initial);
    }
  }
}

function getEl(parent) {
  return parent.nodeType && parent || !parent.el && parent || getEl(parent.el);
}

function isNode(arg) {
  return arg && arg.nodeType;
}

var htmlCache = {};

function html(query) {
  var args = [],
      len = arguments.length - 1;

  while (len-- > 0) args[len] = arguments[len + 1];

  var element;
  var type = typeof query;

  if (type === 'string') {
    element = memoizeHTML(query).cloneNode(false);
  } else if (isNode(query)) {
    element = query.cloneNode(false);
  } else if (type === 'function') {
    var Query = query;
    element = new (Function.prototype.bind.apply(Query, [null].concat(args)))();
  } else {
    throw new Error('At least one argument required');
  }

  parseArgumentsInternal(getEl(element), args, true);
  return element;
}

var el = html;

html.extend = function extendHtml(query) {
  var args = [],
      len = arguments.length - 1;

  while (len-- > 0) args[len] = arguments[len + 1];

  var clone = memoizeHTML(query);
  return html.bind.apply(html, [this, clone].concat(args));
};

function memoizeHTML(query) {
  return htmlCache[query] || (htmlCache[query] = createElement(query));
}

function styleInject(css, ref) {
  if (ref === void 0) ref = {};
  var insertAt = ref.insertAt;

  if (!css || typeof document === 'undefined') {
    return;
  }

  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.type = 'text/css';

  if (insertAt === 'top') {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

var css_248z = ".container-scrapper-wrapper {\n  font-size: 16px;\n}\n.container-scrapper-wrapper .start-scrapper {\n  background-color: #e12a27;\n  border: 1px solid #e12a27;\n  font-weight: normal;\n  line-height: 1;\n  padding: 9px 20px;\n  position: relative;\n  text-transform: uppercase;\n}\n.container-scrapper-wrapper .start-scrapper:hover {\n  cursor: pointer;\n}\n.container-scrapper-wrapper .start-scrapper:active {\n  background-color: #ce1110;\n}\n.container-scrapper-wrapper .start-scrapper__text {\n  color: #ffffff;\n  transition: all 0.2s;\n}\n.container-scrapper-wrapper .start-scrapper__text::after {\n  content: \"Run Scrapper\";\n}\n.container-scrapper-wrapper .start-scrapper__spinner {\n  padding: 9px 20px;\n}\n.container-scrapper-wrapper .start-scrapper__spinner::after {\n  content: \"\";\n  height: 16px;\n  position: absolute;\n  width: 16px;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  margin: auto;\n  border: 4px solid transparent;\n  border-top-color: #ffffff;\n  border-radius: 50%;\n  animation: animation-spinner 1s ease infinite;\n}\n@keyframes animation-spinner {\n  from {\n    transform: rotate(0turn);\n  }\n  to {\n    transform: rotate(1turn);\n  }\n}";
styleInject(css_248z);

const SetAllPages = async allPages => {
  return sendRequest('setAllPages', allPages);
};

const sendRequest = async (link, params) => {
  const linkApi = createLinkApi();
  const response = await fetch(`${linkApi}${link}`, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
      'X-WP-Nonce': scrapperSettings.nonce
    },
    body: JSON.stringify({
      params: params
    })
  });
  return response.json();
};

const createLinkApi = () => {
  const patternAdminWp = 'wp-admin/admin.php';
  const currentDir = window.location.pathname.replace(patternAdminWp, '');
  return currentDir + 'wp-json/scrapper/v1/main/';
};

class ScrapperButton {
  constructor() {
    this["el"] = el("button", {
      className: "start-scrapper"
    }, el("div", {
      className: "start-scrapper__text"
    }));
  }

}

const ScrapperData = async link => {
  const response = await fetch(`${process.env.BASE_URI}${link}`, {
    method: 'GET',
    mode: 'cors'
  });
  const textHtml = await response.text();
  return htmlParserMainBody(textHtml);
};

const htmlParserMainBody = textHtml => {
  const mainRegex = /<main .*?>([\s\S]*)<\/main>/;
  const mainString = mainRegex.exec(textHtml);

  if (mainString !== null && typeof mainString !== 'undefined' && mainString[1] !== null && typeof mainString[1] !== 'undefined' && mainString[1].length > 0) {
    const mainHtml = stringMainToHtmlEl(mainString[1]);
    /*
        Remove all scripts
    */

    const mainScripts = mainHtml.getElementsByTagName('script');
    let counterScript = mainScripts.length;

    while (counterScript--) {
      mainScripts[counterScript].parentNode.removeChild(mainScripts[counterScript]);
    }
    /*
        Remove all iframe
    */


    const mainIframes = mainHtml.getElementsByTagName('iframe');
    let counterIframe = mainIframes.length;

    while (counterIframe--) {
      mainIframes[counterIframe].parentNode.removeChild(mainIframes[counterIframe]);
    }
    /*
        Remove all images
    */


    const mainImages = mainHtml.getElementsByTagName('img');
    let counterImages = mainImages.length;

    while (counterImages--) {
      mainImages[counterImages].parentNode.removeChild(mainImages[counterImages]);
    }

    if (mainHtml?.firstElementChild?.firstElementChild?.classList.contains('entry-header')) {
      mainHtml.firstElementChild.removeChild(mainHtml.firstElementChild.firstElementChild);
    }

    if (mainHtml?.firstElementChild?.firstElementChild?.lastElementChild?.classList.contains('b-share-calltoaction')) {
      mainHtml.firstElementChild.firstElementChild.removeChild(mainHtml.firstElementChild.firstElementChild.lastElementChild);
    }

    return mainHtml.outerHTML;
  } else {
    return null;
  }
};

const stringMainToHtmlEl = mainHtml => {
  const objDomParser = new DOMParser();
  const domParser = objDomParser.parseFromString(mainHtml, 'text/html');
  return domParser.body.childNodes[0];
};

class ScrapperState {
  constructor() {
    this.states = {};
  }

  setState = (key, value) => {
    return this.states[key] = value;
  };
  getAllStates = () => {
    return this.states;
  };
  getGurrentState = key => {
    if (this.states[key] !== null && typeof this.states[key] !== 'undefined') {
      return this.states[key];
    } else {
      return null;
    }
  };
}

class ScrapperWrapper {
  constructor() {
    this.handleScrapperBlog = this.handleScrapperBlog.bind(this);
    this.el = new ScrapperButton({});
  }

  update = () => {
    /*
        *Parent button :)
    */
    this.el.el.addEventListener('click', this.handleScrapperBlog);
  };
  handleScrapperBlog = async () => {
    let allNamePageLength,
        counterSrapperState = 0;
    this.handleSetButtonSpinner();
    const scrapperState = new ScrapperState();
    await this.handleGetAllNamePage().then(allNamePages => {
      allNamePageLength = allNamePages.length;

      if (allNamePages.length === 0 || allNamePages === null) {
        this.handleSetButtonText();
        return true;
      }

      allNamePages.map(element => {
        ScrapperData(element.page_name + '/').then(resultBody => {
          if (resultBody !== null) {
            scrapperState.setState(element.id, resultBody);
          }
        }).then(() => {
          counterSrapperState++;

          if (allNamePageLength === counterSrapperState) {
            const states = scrapperState.getAllStates();
            SetAllPages(states).then(result => {
              if (result.success !== true) {
                console.log('scrapper code is not working');
              }

              this.handleSetButtonText();
            });
          }
        });
      });
    });
  };
  handleGetAllNamePage = async () => {
    const allNamePages = [];
    const checkBoxPages = document.getElementsByClassName('checkbox-page');

    for (let i = 0; i < checkBoxPages.length; i++) {
      let element = checkBoxPages[i];

      if (element.checked) {
        allNamePages.push({
          id: element.dataset.id,
          page_name: element.dataset.url
        });
      }
    }

    return allNamePages;
  };
  handleSetButtonSpinner = () => {
    this.el.el.toggleAttribute('disabled', true);
    this.el.el.lastChild.classList.remove('start-scrapper__text');
    return this.el.el.lastChild.classList.add('start-scrapper__spinner');
  };
  handleSetButtonText = () => {
    this.el.el.toggleAttribute('disabled', false);
    this.el.el.lastChild.classList.remove('start-scrapper__spinner');
    return this.el.el.lastChild.classList.add('start-scrapper__text');
  };
}

class Index {
  constructor() {
    this.scrapperWrapper = new ScrapperWrapper({});
    this.el = el("div", {
      className: "container-scrapper-wrapper"
    }, this.scrapperWrapper);
    this.scrapperWrapper.update();
  }

}

window.addEventListener('load', () => {
  const widgetWrapper = document.getElementById('container-scrapper');

  if (typeof widgetWrapper !== 'undefined' && widgetWrapper !== null) {
    mount(widgetWrapper, new Index({}));
  } else {
    console.log('#container-scrapper is not found');
  }
});
