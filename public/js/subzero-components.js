class TextComponent extends Component {
    constructor(parent, options, data) {
        super(parent, options);
        if (data) {
            this.data = data
        };
    }

    draw() {
        if (this._data) {
            this.el.innerText = this._data.text;
        }
    }
}

class Input extends Component {
    constructor(parent) {
        super(parent, { class: "input" });
    }
    draw() {
        this.input = $$({parent: this.el, el: "input"});
        this.input.addEventListener("change", this._fireChange.bind(this));
        if (this._data) {
            this.input.value = this._data;
        }
    }
    _fireChange(e){
        this._data = this.input.value;
        this.emit("value", this._data);
    }
}

class TextArea extends Component {
    constructor(parent) {
        super(parent, { class: "input" });
    }
    draw() {
        this.input = $$({parent: this.el, el: "textarea"});
        this.input.addEventListener("change", this._fireChange.bind(this));
        if (this._data) {
            this.input.value = this._data;
        }
    }
    _fireChange(e){
        this._data = this.input.value;
        this.emit("value", this._data);
    }
}

class ExploreTopicCard extends Component {
    constructor(parent, options = { class: "card1 blue" }) {
        super(parent, options);
    }
}

class TopicHeading extends TextComponent {
    constructor(parent, data) {
        super(parent, { class: "heading1 heading1-pill" }, data);
    }
}

class Headline extends TextComponent {
    constructor(parent, data) {
        super(parent, { class: "headline" }, data);
    }
}

class ArticleHeadline extends TextComponent {
    constructor(parent, data) {
        super(parent, { class: "explore1-subtitle" }, data);
    }
}

class BodyTextFade extends TextComponent {
    constructor(parent, data) {
        super(parent, { class: "body-copy-fade" }, data);
    }
}

class BodyText extends TextComponent {
    constructor(parent, data) {
        super(parent, { class: "body-copy" }, data);
    }
}

class Button extends TextComponent {
    constructor(parent, data, clickHandler) {
        super(parent, { class: "button" }, data);
        this.clickable();
        if (clickHandler) {
            this.addListener("click", clickHandler);
        }
    }
}

class ExploreButton extends Component {
    constructor(parent, data) {
        super(parent, { class: "explore-button" });
        this.clickable();
        if (data) this.data = data;
    }
    draw() {
        super.draw();
        if (this._data) {
            div(this.el, "label", this._data.text);
        }
    }
}

class Progress extends Component {
    constructor(parent) {
        super(parent, { class: "progress" });
    }
}

class VideoPlayer extends Component {
    constructor(parent) {
        super(parent, { class: "video-player" });
    }
    draw() {
        this.el.innerText = ""; //its all divs
        let image = div(this.el, "image-top");
        let captionContainer = div(this.el, "image-caption");
        let captionTitle = div(captionContainer, "image-caption-title");
        let captionSubtitle = div(captionContainer, "image-caption-subtitle");
        let _draw = function (data) {
            if (data.link.indexOf("youtube.com") != -1) {
                let ifv = $$({ el: "iframe" }); //https://developers.google.com/youtube/iframe_api_reference
                ifv.type = "text/html";
                ifv.width = "336";
                ifv.height = "200";
                ifv.frameborder = "0";
                ifv.src = "https://www.youtube.com/embed/" + getVideoIdFromUrl(data.link) + "?enablejsapi=1";
                ifv.style.position = "relative";
                ifv.style.top = "-2px";
                ifv.style.left = "-2px";
                image.appendChild(ifv);
            } else if (data.image) {
                image.appendChild($$i(data.image));
                image.addEventListener("dblclick", function () {
                    document.location = data.link;
                });
            }
            captionTitle.appendChild($$t(data.caption));
            captionSubtitle.appendChild($$t(data.subcaption));
        }
        if (this._data) {
            let data = this._data;
            if (data.videoQuery) {
                dofetch(GOOGLE_SEARCH + encodeURI("site:youtube.com " + data.videoQuery), {}, function (search) {
                    _draw({ link: search.items[0].formattedUrl, caption: search.items[0].title, subcaption: "" });
                });
            } else {
                _draw(data);
            }
        }
    }
}

class Article1 extends Component {
    constructor(parent, xtraClass) {
        super(parent, { class: "article1" });
    }
    draw() {
        let title = div(this.el, "title");
        let body = div(this.el, "body");
        if (this._data) {
            let data = this._data;
            title.appendChild($$t(data.title));
            body.appendChild($$t(data.body));
        }
    }
}

class Row extends Component {
    constructor(parent, options = { class: "row" }) {
        super(parent, options);
    }
}

class Column extends Component {
    constructor(parent, options = { class: "column" }) {
        super(parent, options);
    }
}

class PreviewCard extends Component {
    constructor(parent, data, xtraClass) {
        super(parent, { class: "preview-card" + (xtraClass ? " " + xtraClass : "") });
        if (data) this.data = data;
    }
    draw() {
        let image = div(this.el, "image-top");
        let captionContainer = div(this.el, "image-caption-small");
        let captionTitle = div(captionContainer, "image-caption-title-small");
        let captionSubtitle = div(captionContainer, "image-caption-subtitle-small");

        if (this._data) {
            let data = this._data;
            if (data.pagemap && data.pagemap.cse_image && data.pagemap.cse_image.length != 0) {
                image.appendChild($$i(data.pagemap.cse_image[0].src));
                image.addEventListener("dblclick", function () {
                    document.location = data.link;
                });
            }
            captionTitle.appendChild($$t(data.title));
            captionSubtitle.appendChild($$t(data.displayLink));
        }
    }
}

class Article2 extends Component {
    constructor(parent, data) {
        super(parent, { class: "article2" });
        if (data) this.data = data;
    }
    draw() {
        let title = div(this.el, "title");
        let body = div(this.el, "body");
        if (this._data) {
            let data = this._data;
            title.appendChild($$t(data.title));
            body.appendChild($$t(data.body));
        }
    }
}

class Article2Row extends Component {
    constructor(parent, data) {
        super(parent, { class: "article-row" });
        if (data) this.data = data;
    }
    draw() {
        this.el.innerText = "";
        let col1 = div(this.el, "number");
        let col2 = div(this.el, "border-bottom");
        let c2title = div(col2, "title");
        let c2subtitle = div(col2, "source");
        let col3 = div(this.el, "pic border-bottom");

        if (this._data) {
            let data = this._data;
            if (data.pagemap.cse_image && data.pagemap.cse_image.length != 0) {
                col3.appendChild($$i(data.pagemap.cse_image[0].src));
            }
            if (data.link) {
                col3.addEventListener("dblclick", function () {
                    document.location = data.link;
                });
            }

            col1.appendChild($$t(data.day + 1));
            c2title.appendChild($$t(data.title));
            c2subtitle.appendChild($$t(data.displayLink));
        }
    }
}

class Questions extends Component {
    constructor(parent) {
        super(parent, { class: "questions" });
    }
    draw() {
        this.clear();
        if (this._data) {
            let el = this.el;
            let _this = this;
            let data = this._data;
            if (data.answers == null) {
                data.answers = {};
            }
            data.questions.forEach(function (question) {
                new TextComponent(_this, { text: question.question });
                if (question.possibleAnswers && question.possibleAnswers.length != 0) {
                    let answers = new Answers(_this, question.possibleAnswers);
                    if (data.answers && data.answers[question.propertyName]) {
                        answers.answer = data.answers[question.propertyName];
                    }
                    answers.addListener("value", function (e) {
                        if (e == null) {
                            delete data.answers[question.propertyName];
                        } else {
                            data.answers[question.propertyName] = e;
                        }
                        _this.emit("value", data.answers);
                    });
                }
                // if (Boolean(question.allowFreeText)) {
                //     div(el, "freetext", "freetext");
                // }
            });
        }
    }
}

class Answers extends Component {
    constructor(parent, data, classes) {
        super(parent, { class: classes ? classes[0] : "answers" });
        this.classes = classes;
        this.selectedIdx = -1;
        this.data = data ? data : [];
    }
    draw() {
        this.clear();
        let parent = this;
        let itemClass = this.classes != null ? this.classes[1] : "answer";
        this._data.forEach(function (answer, idx) {
            let a = new Answer(parent, itemClass);
            if (parent.selectedIdx == idx) {
                a.selected = true;
            }
            a.click(function () {
                parent.select(idx);
            });
            a.data = { text: answer };
        })
    }
    select(idx) {
        if (idx == this.selectedIdx) {
            idx = -1;
        }
        this.selectedIdx = idx;
        this.draw();
        this.emit("value", this.answer);
    }
    get answer() {
        if (this.selectedIdx == -1)
            return null;
        else
            return this._data[this.selectedIdx];
    }
    set answer(a) {
        this.select(this._data.indexOf(a));
    }

}

class Answer extends TextComponent {
    constructor(parent, className) {
        super(parent, { class: className });
    }
    draw() {
        super.draw();
        if (this.selected) {
            this.el.classList.add("selected");
        } else {
            this.el.classList.remove("selected");
        }
    }
}

class Carousel extends Component {
    constructor(parent) {
        super(parent, { class: "card-carousel" });
        this.dragging = false;
        this.offset = 0;
        this.offsetD = 0;
        this.cellWidth = 360;
        this._initDrag();
    }

    _initDrag() {
        let _this = this;
        let down = function (e) {
            e.preventDefault();
            _this.dragging = true;
            _this.clickX = e.screenX;
        };
        let move = function (e) {
            e.preventDefault();
            if (_this.dragging) {
                _this.offset = e.screenX - _this.clickX;
                _this.draw();
            }
        }
        let up = function (e) {
            e.preventDefault();
            _this.dragging = false;
            if (_this.offset > 30) {
                _this.offsetD += 1;
            } else if (_this.offset < -30) {
                _this.offsetD -= 1;
            }
            _this.offsetD = Math.max(0, Math.min(_this.offsetD, _this.children.length - 1));
            _this.offset = 0;
            _this.draw();
        }
        this.el.addEventListener("mousedown", down);
        this.el.addEventListener("mousemove", move);
        document.addEventListener("mouseup", up);
        // this.el.ontouchstart = down;
        // this.el.ontouchmove = move;
        // document.ontouchend = up;
        // document.ontouchcancel = up;
    }

    draw() {
        let _this = this;
        this.children.forEach(function (c, idx) {
            c.el.style.left = -idx * _this.cellWidth + _this.offset + (_this.offsetD * _this.cellWidth) + 30;
        });
    }
}
