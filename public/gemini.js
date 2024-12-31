
const GEMINI_SERVICE = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyBtGPTUHs5hALl55M47Ugkg79o4wsn-efQ";

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