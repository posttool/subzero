function dofetch(apiUrl, params, f) {
    const request = new Request(apiUrl, params);
    fetch(request)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            f(data);
        });
}

function dofetchGemini(prompt, handler, count = 0) {
    if (logger == null) {
        logger = console;
    }
    logger.log('----------------------')
    logger.log(prompt);
    let jsonPrompt = getGeminiContentParams(prompt);
    dofetch(GEMINI_SERVICE, { method: "POST", body: JSON.stringify(jsonPrompt) }, function (jsonData) {
        let objectData = null;
        try {
            objectData = parseGeminiJson(jsonData.candidates[0].content.parts[0].text);
            logger.log(objectData);
        } catch (e) {
            logger.error(e);
            if (count < 3) {
                logger.log('ERROR retry in 1');
                setTimeout(function () { dofetchGemini(prompt, handler, count + 1); }, 1000);
            } else {
                logger.log("GIVING UP");
            }
            return;
        }
        handler(objectData);
    });
}

const PROMPT_JSON = "Format the answer in JSON.  Make Sure the JSON is valid. Use this schema:";

function GEM(templatedPrompt, data, handler) {
    if (Object.hasOwn(templatedPrompt, "instruction")) {
        templatedPrompt = templatedPrompt.instruction + PROMPT_JSON + templatedPrompt.jsonSchema;
    }
    dofetchGemini(processTemplate(templatedPrompt, data), handler);
}

function parseGeminiJson(text) {
    text = text.replace("```json", "");
    text = text.replace("```", "");
    let srcs = JSON.parse(text);
    return srcs;
}

function getGeminiContentParams(text) {
    return {
        contents: [{
            parts: [{
                text: text
            }]
        }]
    };
}

function random(a) {
    return Math.floor(Math.random() * a);
}

function oneOf(array) {
    if (array && array.length != 0)
        return array[random(array.length)];
    else
        return {};
}

function getByName(array, name) {
    for (var i = 0; i < array.length; i++) {
        if (array[i].name == name) {
            return array[i];
        }
    };
    return null;
}

function isArray(x) {
    return Array.isArray(x);
}

function isObject(x) {
    return typeof x === 'object' && !isArray(x) && x !== null;
}

function callbackCounter(callback) {
    let o = {
        count: 0,
        target: 0
    };
    o.complete = function () {
        o.target++;
        if (o.target == o.count) {
            callback();
        }
    }
    return o;
}

function getVideoIdFromUrl(url) {
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    var match = url.match(regExp);
    return (match && match[7].length == 11) ? match[7] : false;
}

function $(id) {
    return document.getElementById(id);
}

function $$(o) {
    if (o == null)
        o = {};
    if (o.el == null)
        o.el = 'div';
    var $t = document.createElement(o.el);
    if (o.text)
        $t.appendChild(document.createTextNode(o.text));
    if (o.color)
        $t.style.color = o.color;
    if (o.backgroundColor)
        $t.style.backgroundColor = o.backgroundColor;
    if (o.class)
        $t.setAttribute('class', o.class);
    if (o.id)
        $t.setAttribute('id', o.id);
    if (o.type)
        $t.setAttribute('type', o.type);
    if (o.value)
        $t.setAttribute('value', o.value);
    if (o.click)
        $t.addEventListener('click', o.click);
    if (o.parent)
        o.parent.appendChild($t);
    return $t;
}

function div(parentEl, className, text) {
    return $$({ parent: parentEl, class: className, text: text });
}

function $$i(url) {
    let img = $$({ el: "img" });
    img.src = url;
    img.setAttribute("draggable", false);
    return img;
}

function $$t(text) {
    return document.createTextNode(text);
}

function $$mi(o) {
    if (o.class) {
        o.class = 'material-symbols-outlined ' + o.class;
    } else {
        o.class = 'material-symbols-outlined';
    }
    o.type = 'span';
    return $$(o)
}

function $$sel(o = { options: [], namevalue: false }) {
    o.el = 'select';
    var $sel = $$(o);
    for (var i = 0; i < o.options.length; i++) {
        if (o.namevalue) {
            $$({ parent: $sel, el: 'option', text: o.options[i][0], value: o.options[i][1] });
        } else {
            $$({ parent: $sel, el: 'option', text: o.options[i] });
        }
    }
    return $sel;
}

function getSelectValue(selEl) {
    return selEl.options[selEl.selectedIndex].value;
}

function setSelectValue(selEl, value) {
    for (var i = 0; i < selEl.options.length; i++) {
        if (selEl.options[i].value == value) {
            selEl.selectedIndex = i;
            return;
        }
    }
    return;
}

function format(str, color, parent) {
    return $$({ el: 'span', text: str, parent: parent, color: color });
}

function syntaxHighlight(json) {
    if (typeof json != 'string') {
        json = JSON.stringify(json, undefined, 2);
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

function processTemplate(templateString, values) {
    const result = templateString.replace(/\${(\w+)}/g, function (match, key) { return values[key] });
    return result;
}

class Component {
    constructor(parent = null, options = {}) {
        this.children = [];
        this.listeners = {};
        this.el = $$(options);
        this._data = null;
        if (parent != null)
            parent.addChild(this, options.addAtIndex);
    }

    draw() {
    }

    set data(data) {
        this._data = data;
        this.draw();
    }

    get data() {
        return this._data;
    }

    visible(b, el = null) {
        if (el == null)
            el = this.el;
        el.style.display = b ? '' : 'none';
    }

    addChild(component, idx) {
        component.parent = this;
        if (idx == null) {
            this.children.push(component);
            this.el.appendChild(component.el);
        } else {
            this.children.splice(idx, 0, component);
            this.el.insertBefore(component.el, this.el.childNodes[idx]);
        }
    }

    remove(c) {
        if (c == null) {
            this.parent.remove(this);
        } else {
            c.el.remove();
            var idx = this.children.indexOf(c);
            if (idx == -1) {
                return;
            }
            this.children.splice(idx, 1);
        }
    }

    addListener(type, func) {
        if (!this.listeners[type]) {
            this.listeners[type] = [];
        }
        this.listeners[type].push(func);
    }

    emit(type, value) {
        var funcs = this.listeners[type];
        if (funcs) {
            for (var i = 0; i < funcs.length; i++) {
                funcs[i](value, this);
            }
        }
    }

    clear() {
        this.el.innerText = '';
        this.children = [];
    }

    clickable() {
        if (!this._clickableInit) {
            this.el.addEventListener("click", this.emit.bind(this, "click"));
            this._clickableInit = true;
        }
    }

    click(f) {
        this.clickable();
        this.addListener("click", f);
    }

}
