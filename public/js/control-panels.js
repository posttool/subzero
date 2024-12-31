const INTEREST_OPTIONS = [
    "8 years old, California",
    "19 years old",
    "Minimalist music, Abstract art",
    "33 years old, lives in New York, visiting Tokyo",
    "Lives in Oaxaca",
    "Undefined",
];

const DEBUG_TOPICS = [
    "Learn how to juggle",
    "Record cover art",
    "The Absurdity of Surrealist Painting",
    "Chess strategy",
    "Mastering the Art of Mezcal Cocktails (with a twist)",
    "Creating a Stop-Motion Animation Film",
    "The History of Zapotec Weaving Techniques"
];

const PROMPT_ORDER = ["topics", "overview", "editorial", "questions", "plan"];

class ControlPanel extends Component {
    constructor(parent) {
        super(parent, { class: "control-panel" });
        this._prompts = BOOTSTRAP_PROMPTS;

        let isOpen = true;
        let panelIdx = 0;
        let editors = {};
        this._editors = editors;

        let controlContainer = new Component(this);
        let panelContainer = new Component(this);

        let closeButton = new CPButton(controlContainer, "close");
        closeButton.click(function () {
            openClose(!isOpen);
        });

        let addTopicButton = new CPButton(controlContainer, "add_circle");
        addTopicButton.click(function () {
            panelIdx = 0;
            openClose(true);
        });
        let topicPanel = new CPTopic(panelContainer);
        topicPanel.addInterests();
        topicPanel.addDefaultTopics();
        topicPanel.addButtons();

        let _this = this;
        PROMPT_ORDER.forEach(function (p, idx) {
            let prompt = _this.prompts[p];
            prompt.name = p;
            let editButton = new CPButton(controlContainer, "edit");
            editButton.click(function () {
                panelIdx = idx + 1;
                openClose(true);
            });
            let editor = new Editor1(panelContainer, prompt.name, function (e) {
                _this.editorChangeValue(editor);
            });
            editor.data = prompt;
            editors[prompt.name] = editor;
        });

        let outputButton = new CPButton(controlContainer, "breaking_news_alt_1");
        outputButton.click(function () {
            panelIdx = panelContainer.children.length - 1;
            openClose(true);
        });

        this.logger = new CPOutput(panelContainer);

        let openClose = function (b) {
            panelContainer.children.forEach(function (p) {
                p.visible(false);
            });
            if (!b) {
                closeButton.el.innerText = "expand_all";
            } else {
                closeButton.el.innerText = "close";
                panelContainer.children[panelIdx].visible(true);
            }
            let wc = $("info");
            if (!b) {
                wc.style.width = "48px";
            } else {
                if (panelIdx == 0) {
                    wc.style.width = "430px";
                } else {
                    wc.style.width = "740px";
                }
            }
            isOpen = b;
        }
        openClose(true);
    }

    init(callback) {
        let _this = this;
        db.getAll(STORE_PROMPTS, function (instance) {
            _this.addPrompt(instance);
            if (callback) callback(_this);
        });
    }

    get prompts() {
        return this._prompts;
    }

    editorChangeValue(editor) {
        this._prompts[editor.name] = editor.data;
        db.put(STORE_PROMPTS, { id: editor.name, data: editor.data }, function (e) {
        });
    }

    addPrompt(dbInstance) {
        this._prompts[dbInstance.value.id] = dbInstance.value.data;
        this._editors[dbInstance.value.id].data = dbInstance.value.data;
    }
}

class CPSelector extends Component {
    constructor(parent) {
        super(parent, { class: "control-panel" });
    }

    draw() {
        var _this = this;
        this.selector = new Answers(this, this._data, ["prefs", "pref"]);
        this.selector.addListener("value", function (v) {
            if (v != null) {
                _this.emit("value", v);
            }
        });
    }

    get value() {
        return this.selector.answer;
    }
}

var Delta = Quill.import("delta");

class Editor1 extends Component {
    constructor(parent, name, onChangeValue) {
        super(parent);
        this.name = name;
        div(this.el, "explore1-subtitle", name);
        let c1 = div(this.el);
        let c2 = div(this.el);
        this.quillPrompt = new Quill(c1, { // https://quilljs.com/docs
            modules: {
                syntax: true,
                toolbar: null
            }
        });
        this.quillJson = new Quill(c2, {
            modules: {
                syntax: true,
                toolbar: null
            },
        });

        let _this = this;
        this.quillPrompt.on("text-change", function (delta, oldDelta, source) {
            if (source == "user") {
                onChangeValue(_this);
            }
        });
        this.quillJson.on("text-change", function (delta, oldDelta, source) {
            if (source == "user") {
                onChangeValue(_this);
            }
        });
    }

    set data(d) {
        this.quillPrompt.setContents(
            new Delta().insert(d.instruction, { "code-block": "markdown" })
        );
        this.quillJson.setContents(
            new Delta().insert(d.jsonSchema, { "code-block": "javascript" })
        );
    }

    get data() {
        return {
            name: this.name,
            instruction: this.quillPrompt.getText(),
            jsonSchema: this.quillJson.getText()
        };
    }
}

class CPButton extends Component {
    constructor(parent, text, className = "") {
        super(parent, { el: "span", class: "material-symbols-outlined ", text: text });
    }
}

function prepForLog(s) {
    if (!(typeof s === 'string')) {
        s = JSON.stringify(s);
    }
    let ss = s.split("\n");
    ss = ss.join("<br/>");
    return ss;
}

class CPOutput extends Component {
    constructor(parent) {
        super(parent, { class: "logger" });
    }

    log(msg) {
        console.log(msg);
        let l = div(this.el, "log");
        l.innerHTML = prepForLog(msg);
    }
    error(msg) {
        console.error(msg);
        let l = div(this.el, "error");
        if (msg && msg.stack && msg.message) {
            msg = msg.message + "\n" + msg.stack;
        }
        l.innerHTML = prepForLog(msg);
    }
}

class CPTopic extends Component {

    constructor(parent) {
        super(parent);
        this.preferences = null;
        this.top = new Component(this);
        this.bottom = new Component(this);
    }

    addInterests() {
        let defaultInterests = new Component(this.top);
        new ArticleHeadline(defaultInterests, { text: "Interests" });
        let p = new CPSelector(defaultInterests);
        p.data = INTEREST_OPTIONS;
        p.selector.select(random(INTEREST_OPTIONS.length));
        p.addListener("value", function () {

        });
        this.preferences = p;
        return defaultInterests;
    }

    addDefaultTopics() {
        let preferences = this.preferences;
        let defaultTopics = new Component(this.top);
        new ArticleHeadline(defaultTopics, { text: "Debug Topics" });
        let topicChooser = new CPSelector(defaultTopics);
        topicChooser.data = DEBUG_TOPICS;
        topicChooser.addListener("value", function (selectedTopic) {
            newTopicOverview(selectedTopic, preferences.value);
        });
    }

    addTopicsForPrefs() {
        let preferences = this.preferences.value;
        let defaultTopics = new Component(this.top);
        new ArticleHeadline(defaultTopics, { text: "Topics" });
        new BodyText(defaultTopics, { text: preferences });
        let topicChooser = new CPSelector(defaultTopics);
        let progress = new Progress(defaultTopics);
        GEM(getPrompt("topics"), { preferences: preferences }, function (topics) {
            progress.remove();
            topicChooser.data = topics.map(topic => topic.name);
            topicChooser.addListener("value", function (selectedTopic) {
                console.log("select " + selectedTopic)
                newTopicOverview(selectedTopic, preferences);
            });
        });
        return defaultTopics;
    }

    addButtons() {
        let _this = this;
        let buttons = new Component(this.bottom);
        let b1 = new Button(buttons, {text: "Generate topics for selected interests"});
        b1.click(function(){
            _this.addTopicsForPrefs();
        });
        let b2 = new Button(buttons, {text: "Clear all explorations"});
        b2.click(function(){
            deleteAll();
        });
    }
}


function deleteAll() {
    let i = 0;
    let c = db.stores;
    let d = function () {
        db.deleteAll(c[i].name, function () {
            console.log("deleted " + c[i].name);
            i++;
            if (i == c.length) {
                cardsEl.innerText = "";
                carousel.clear();
                showCarousel(true);
            } else {
                d();
            }
        });
    }
    d();
}


