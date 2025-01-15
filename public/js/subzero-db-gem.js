const BOOTSTRAP_PROMPTS = {
    overview: {
        instruction: `I'm interested in improving and learning about: \${topic}.
Create a intro card with just enough info to find out if I am interested in learning more.
Write in a style appropriate for me: \${preferences}.
`,
        jsonSchema: `{ 
title: "Short title",
subtitle: "A longer subtitle, up to eight words or so",
imageQuery: "a relevant query for YouTube seach"
caption: "a caption for the image",
overview: "A overview of why this topic is interesting with insights and teasers that are age appropriate no more than 40 words"
}
`
    },
    topics: {
        instruction: `Purpose
Your purpose is to inspire and spark creativity. You'll help me brainstorm ideas for all sorts of things: 
gifts, party themes, story ideas, weekend activities, and more. 

Goals
* Act like my personal idea generation tool coming up with ideas that are relevant to the prompt, original, and out-of-the-box. 
* Collaborate with me and look for input to make the ideas more relevant to my needs and interests.

Here is some info about me: \${preferences}
I would like a list of interesting and new topics that I can explore and learn from.
The topics should be goal oriented, an applied way to learn that I can make progress on day by day.

Some of the topics should be entertaining or funny and some should be serious and intellectual. 
Surprise me!
Suggest at least ten topics.
`,
        jsonSchema: `[
{name: "Topic name", description: "A medium length description about why the topic is topical"},
{name: "", description: ""},
{name: "", description: ""},
]
`
    },
    editorial: {
        instruction: `Apply editorial constraints.
Write in a style appropriate for me: \${preferences}. 
Rewrite "\${caption}"" into a two to four word title and three to six word subtitle.
`,
        jsonSchema: `{ 
title: "Short title",
subtitle: "Subtitle"
}
`
    },
    questions: {
        instruction: `I'm interested in improving and learning about: \${name}.

You will be writing a goal oriented plan. But before that step, you want to ask disambiguating questions.
For the next step, ask up to four essential clarifying questions.
Write in a style appropriate for me: \${options}.
`,
        jsonSchema: `{
questions: [
{
question: "Question no longer than eight words?", 
possibleAnswers: ["Option 1", "Option 2", "", "Other"], 
propertyName: "metaQuestion"
},
]
}
`
    },
    plan: {
        instruction: `I'm interested in improving and learning about: \${name}.

For the next step, I'd like you to create a 7-day plan of updates, giving me a sub-topic of each day, delving more into the sub-topic with an insight that frames it and makes it relevant, as well as a recommendation for what I can do.
Write in a style appropriate for me: \${options}. 
Use these topic preferences: \${topicPreferences}
`,
        jsonSchema: `{ 
plan: "Overview of the plan with an explanation of how a goal or achievement has been broken down",
days: [ 
{
goal: "Ten or so words about how this subtopic helps achieve understanding of the topic", 
insight: "A few paragraphs with insights into how this subtopic helps make progress toward understanding", 
insightSearchQuery: "short query that captures the goal and the insight", 
recommendation: "A few paragraphs with recommendations about how to get deeper understanding about this subtopic", 
recommendationSearchQuery: "short query that captures the goal and the recommendation", 
videoQuery: "a relevant query for YouTube search",
mapQuery: "if the recommendation is to visit a place, a relevant query for a Map search",
title: "Two or three words"
},
]
}
`
    }
};

// from https://support.google.com/gemini/answer/15235907
const PROMPT_BRAINSTORMER = {
    instruction: `
Purpose
Your purpose is to inspire and spark creativity. You’ll help me brainstorm ideas for all sorts of things: 
gifts, party themes, story ideas, weekend activities, and more. 

Goals
* Act like my personal idea generation tool coming up with ideas that are relevant to the prompt, original, and out-of-the-box. 
* Collaborate with me and look for input to make the ideas more relevant to my needs and interests.

Overall direction
* Ask questions to find new inspiration from the inputs and perfect the ideas.
* Use an energetic, enthusiastic tone and easy to understand vocabulary.
* Keep context across the entire conversation, ensuring that the ideas and responses are related to all the previous turns of conversation.
* If greeted or asked what you can do, please briefly explain your purpose. Keep it concise and to the point, giving some short examples.

Step-by-step instructions

* Understand my request: Before you start throwing out ideas, clarify my request by asking pointed questions about interests, needs, themes, location, or any other detail that might make the ideas more interesting or tailored. For example, if the prompt is around gift ideas, ask for the interests and needs of the person that is receiving the gift. If the question includes some kind of activity or experience, ask about budget or any other constraint that needs to be applied to the idea.
* Show me options: Offer at least three ideas tailored to the request, numbering each one of them so it’s easy to pick a favorite.
Share the ideas in an easy-to-read format, giving a short introduction that invites me to explore further.
Location-related ideas: If the ideas imply a location and, from the previous conversation context, the location is unclear, ask if there’s a particular geographic area where the idea should be located or a particular interest that can help discern a related geographic area.
Traveling ideas: When it comes to transportation, ask what is the preferred transportation to a location before offering options. If the distance between two locations is large, always go with the fastest option.
* Check if I have something to add: Ask if there are any other details that need to be added or if the ideas need to be taken in a different direction. Incorporate any new details or changes that are made in the conversation.
* Ask me to pick an idea and then dive deeper: If one of the ideas is picked, dive deeper. Add details to flesh out the theme but make it to the point and keep the responses concise.
`};


const STORE_TOPIC_INSTANCE = "TopicInstance";
const TOPIC_STATE_OVERVIEW = 11;
const TOPIC_STATE_QUESTIONS = 21;
const TOPIC_STATE_EXPLORATION = 31;

const STORE_TOPIC_INTRO = "TopicIntro";
const STORE_TOPIC_QUESTIONS = "TopicQuestions";
const STORE_EXPLORATIONS = "Explorations";
const STORE_PROMPTS = "Prompts";

let db = new IndexedDB({
    dbName: "subzero3",
    version: 3,
    stores: [
        { name: STORE_TOPIC_INSTANCE, indices: [] },
        { name: STORE_TOPIC_INTRO, indices: [] },
        { name: STORE_TOPIC_QUESTIONS, indices: [] },
        { name: STORE_EXPLORATIONS, indices: [] },
        { name: STORE_PROMPTS, indices: [] },
    ]
});
//indices look like [{name: "titleIndex", fields: ["title"]}]

class TopicInstance {
    constructor() {
        this.id = null;
        this.name = null;
        this.options = null;
        this.meta = null;
        this.overview = null;
        this.qa = null;
        this.exploration = null;
    }

    set data(data) {
        this.id = data.id;
        this.name = data.name;
        this.options = data.options;
        this.meta = data;
    }

    init(callback) {
        let _this = this;
        let cc = callbackCounter(function () { callback(_this) });
        if (_this.meta.state >= TOPIC_STATE_OVERVIEW) {
            cc.count++;
            db.get(STORE_TOPIC_INTRO, _this.id, function (topicOverview) {
                _this.overview = topicOverview.data;
                cc.complete();
            });
        }
        if (_this.meta.state >= TOPIC_STATE_QUESTIONS) {
            // cc.count++;
            // _this.addQuestions(cc.complete);
        }
        if (_this.meta.state >= TOPIC_STATE_EXPLORATION) {
            cc.count++;
            _this.addExploration(cc.complete);
        }
        if (cc.count == 0)
            cc.complete();

    }

    addOverview(name, options, callback) {
        this.id = name + " -- " + options;
        this.name = name;
        this.options = options;
        let _this = this;
        generateTopicOverview(_this.name, _this.options, function (topicOverview) {
            db.put(STORE_TOPIC_INTRO, { id: _this.id, data: topicOverview }, function () {
                db.put(STORE_TOPIC_INSTANCE,
                    {
                        id: _this.id,
                        name: name,
                        options: options,
                        state: TOPIC_STATE_OVERVIEW,
                        day: 0
                    },
                    function (topicInstance) {
                        _this.meta = topicInstance;
                        _this.overview = topicOverview;
                        callback(_this);
                    });
            });
        });
    }

    _saveState(state, callback) {
        let _this = this;
        if (_this.meta.state < state) {
            _this.meta.state = state;
            db.put(STORE_TOPIC_INSTANCE, _this.meta, function () {
                callback(_this);
            });
        } else {
            callback(_this);
        }
    }

    savePreferences(answers, callback) {
        this.meta.updated = new Date();
        this.meta.topicPreferences = answers;
        db.put(STORE_TOPIC_INSTANCE, this.meta, callback);
    }

    getPreferences() {
        return this.meta.topicPreferences;
    }

    addQuestions(callback) {
        let _this = this;
        generateCache(STORE_TOPIC_QUESTIONS, _this.id, getPrompt("questions"), _this.meta,
            function (dbContent) {
                _this.qa = dbContent;
                _this._saveState(TOPIC_STATE_QUESTIONS, callback);
            });
    }

    addExploration(callback) {
        let _this = this;
        const metaAndAnswers = Object.assign({}, _this.meta, { topicPreferences: JSON.stringify(_this.meta.topicPreferences) });
        generateCache(STORE_EXPLORATIONS, _this.id, getPrompt("plan"), metaAndAnswers,
            function (dbContent) {
                _this.exploration = dbContent.data;
                _this._saveState(TOPIC_STATE_EXPLORATION, callback);
            });
    }

    setDay(idx, callback) {
        let _this = this;
        _this.meta.day = Math.min(_this.exploration.days.length - 1, Math.max(0, idx));
        db.put(STORE_TOPIC_INSTANCE, _this.meta, function () {
            callback(_this);
        });
    }

    getCurrentDay() {
        return this.exploration.days[this.meta.day];
    }
}

function generateTopicOverview(t, prefs, handler) {
    GEM(getPrompt("overview"), { topic: t, preferences: prefs }, function (overview) {
        dofetch(GOOGLE_SEARCH + encodeURI("site:youtube.com " + overview.imageQuery) + "&num=1", {}, function (search) {
            let searchBit = {
                image: search.items[0].pagemap.cse_image[0].src,
                caption: search.items[0].title,
                preferences: prefs
            };
            GEM(getPrompt("editorial"), searchBit, function (rewrittenCaption) {
                let cdata = {
                    heading: overview.title,
                    headline: overview.subtitle,
                    overview: overview.overview,
                    image: search.items[0].pagemap.cse_image[0].src,
                    caption: rewrittenCaption.title,
                    subcaption: rewrittenCaption.subtitle,
                    link: search.items[0].formattedUrl,
                    color: getColor()
                };
                handler(cdata);
            });
        });
    });
}

function generateCache(store, id, prompt, promptParams, renderCallback) {
    db.get(store, id, function (dbContent) {
        if (dbContent == null) {
            GEM(prompt, promptParams, function (genContent) {
                dbContent = { id: id, data: genContent }
                db.put(store, dbContent, function () {
                    renderCallback(dbContent, true);
                });
            });
        } else {
            renderCallback(dbContent, false);
        }
    });
}