const GOOGLE_SEARCH = "https://www.googleapis.com/customsearch/v1?key=AIzaSyBXzoVT6ti7Ul9x0suevmJkDFuafYKsDE4&cx=836c3d378e8094ce4&q=";

const COLOR_LIST = ["blue", "green", "red"];
let colorIdx = random(COLOR_LIST.length) - 1;
function getColor() {
    colorIdx++;
    return COLOR_LIST[colorIdx % COLOR_LIST.length];
}

let personasEl = $("persona-list");
let exploreEl = $("explore-container");
let cardsEl = $("card-carousel");
let controlsEl = $("info");

let carousel = new Carousel();
cardsEl.appendChild(carousel.el);

let exploreRoot = new Component();
exploreEl.appendChild(exploreRoot.el);

function showCarousel(b) {
    cardsEl.style.display = b ? "block" : "none";
    exploreEl.style.display = !b ? "block" : "none";
}

function newTopicOverview(topicDescription, prefs) {
    showCarousel(true);
    let progress = new Progress(carousel);
    let topic = new TopicInstance();
    topic.addOverview(topicDescription, prefs, function () {
        progress.remove();
        renderTopicOverview(topic, 0);
    });
}

function renderTopicOverview(topic, idx) {
    carousel.children.forEach(function (c) {
        if (c.data.id == topic.meta.id) {
            c.remove();
        }
    });

    let topicCard = new ExploreTopicCard(carousel, { addAtIndex: idx, class: "card1 " + topic.overview.color });
    let heading = new TopicHeading(topicCard);
    let headline = new Headline(topicCard);
    let video = new VideoPlayer(topicCard);
    let bodyText = new BodyText(topicCard);
    topicCard.data = topic.meta;
    heading.data = { text: topic.overview.heading };
    headline.data = { text: topic.overview.headline };

    if (topic.meta.state == TOPIC_STATE_OVERVIEW || topic.meta.state == TOPIC_STATE_QUESTIONS) {
        video.data = topic.overview;
        bodyText.data = { text: topic.overview.overview };
        let questionsButton = new ExploreButton(topicCard);
        questionsButton.data = { text: "Explore" };
        questionsButton.addListener("click", function () {
            let progress = new Progress(questionsButton);
            topic.addQuestions(function () {
                progress.remove();
                renderExplorationWithQuestions(topic);
            });
        });
    }
    else if (topic.meta.state == TOPIC_STATE_EXPLORATION) {
        topic.init(function () {
            let day = topic.getCurrentDay();
            video.data = day;
            bodyText.data = { text: day.goal };
            let exploreButton = new ExploreButton(topicCard);
            exploreButton.data = { text: "Day " + (topic.meta.day + 1) };
            exploreButton.addListener("click", function () {
                renderExplorationForDay(topic);
            });
        });
    }
    carousel.draw();
}

function renderExplorationWithQuestions(topic) {
    exploreRoot.clear();
    showCarousel(false);

    let topicCard = new ExploreTopicCard(exploreRoot, { class: "card1 " + topic.overview.color });
    let heading = new TopicHeading(topicCard);
    let headline = new Headline(topicCard);
    let bodyText = new BodyText(topicCard);

    topicCard.data = topic.overview;
    heading.data = { text: topic.overview.heading };
    headline.data = { text: topic.overview.headline };
    bodyText.data = { text: topic.overview.overview };

    let r1 = new Row(topicCard);
    let caption = new BodyText(topicCard, { text: "Select optional preferences" });
    let r2 = new Row(topicCard);
    let generateExplorationButton = new Button(r1);
    let questions = new Questions(r2);

    let countAnswers = function () {
        let p = topic.getPreferences();
        let c = p ? Object.keys(p).length : 0;
        if (c == 0) {
            generateExplorationButton.data = { text: "Dive in >" };
        } else {
            generateExplorationButton.data = { text: "Explore with " + c + " preferences >" };
        }
    }
    countAnswers();

    questions.data = { questions: topic.qa.data.questions, answers: topic.getPreferences() }
    questions.addListener("value", function (answers) {
        topic.savePreferences(answers, function () {
            countAnswers();
        });
    });

    generateExplorationButton.click(function () {
        r1.clear();
        r2.remove();
        caption.remove();
        let progress = new Progress(r1);
        topic.addExploration(function () {
            progress.remove();
            renderExplorationForDay(topic);
        });
    });
}

function renderExplorationForDay(topic) {
    exploreRoot.clear();
    showCarousel(false);

    let root = new Component(exploreRoot);
    let toc = new Component(root, { class: "card1 toc " + topic.overview.color });
    let topicCard = new ExploreTopicCard(root, { class: "card1 " + topic.overview.color });
    let heading = new TopicHeading(topicCard);
    let headline = new Headline(topicCard);

    topicCard.data = topic.overview;
    heading.data = { text: topic.overview.heading };
    headline.data = { text: topic.overview.headline };

    let dayLabel = new ArticleHeadline(topicCard, { text: "Day " + (topic.meta.day + 1) });
    let controls = new Row(topicCard);
    let back = new Button(controls, { text: "Back" });
    let next = new Button(controls, { text: "Next" });
    let close = new Button(controls, { text: "Close" });
    let dayContainer = new Column(topicCard);

    let setDay = function (idx) {
        topic.setDay(idx, function () {
            dayLabel.data = { text: "Day " + (topic.meta.day + 1) };
            renderDay();
        });
    }

    back.click(function (e) {
        setDay(topic.meta.day - 1);
    });
    next.click(function (e) {
        setDay(topic.meta.day + 1);
    });
    close.click(function (e) {
        renderTopicOverview(topic, carousel.offsetD);
        showCarousel(true);
    });

    let renderDay = function () {
        toc.clear();
        topic.exploration.days.forEach(function (day, idx) {
            let className = "toc-item" + (idx == topic.meta.day ? " selected" : "");
            let t = new TextComponent(toc, { class: className }, { text: day.title });
            t.click(function () {
                setDay(idx);
            });
        });

        dayContainer.clear();
        let day = topic.getCurrentDay();
        let v = new VideoPlayer(dayContainer);
        v.data = day;
        new Headline(dayContainer, { text: day.goal })
        new ArticleHeadline(dayContainer, { text: "Insight" });
        new BodyText(dayContainer, { text: day.insight });
        let insightArticles =
            new Article1(dayContainer);
        new ArticleHeadline(dayContainer, { text: "Recommendation" });
        new BodyText(dayContainer, { text: day.recommendation });
        let recommendArticles =
            new Article2(dayContainer);

        dofetch(GOOGLE_SEARCH + encodeURI(day.insightSearchQuery) + "&num=3", {}, function (search) {
            new PreviewCard(insightArticles, search.items[0]);
            let r = new Row(insightArticles, "flex-row");
            new PreviewCard(r, search.items[1], "half-width");
            new PreviewCard(r, search.items[2], "half-width");
        });

        dofetch(GOOGLE_SEARCH + encodeURI(day.recommendationSearchQuery) + "&num=3", {}, function (search) {
            search.items.forEach(function (item, idx) {
                item.day = idx;
                let ar = new Article2Row(recommendArticles, item);
            });
        });
    }
    renderDay();
    window.scrollTo(0,0);

}

//////////////////////////////////////////////////////////////////////////////////

function getPrompt(name) {
    console.log(controlPanel.prompts[name])
    return controlPanel.prompts[name];
}

function getLogger() {
    return controlPanel.logger;
}

function main() {
    controlPanel = new ControlPanel();
    controlsEl.appendChild(controlPanel.el);
    logger = controlPanel.logger;

    db.init(function () {
        db.getAll(STORE_TOPIC_INSTANCE, function (instance) {
            let topic = new TopicInstance();
            topic.data = instance.value;
            topic.init(function () {
                renderTopicOverview(topic);
            });
        });

        controlPanel.init(function(){
            logger.log("CP INIT");
        })
    });

    logger.log("TOPIC EXPLORER v1.5");
      
}

main();