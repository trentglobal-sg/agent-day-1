// import in our AI objects
// require - is to import from other files
// the first param to require is where to import from
// ./ -> current directory
const { ai, MODEL } = require('./gemini');
const { getCurrentWeather, getLocation } = require("./tools");

const reactAgentPrompt = `
You are a helpful assistant that can look up user's location and check the weather.
Use the available tools to answer questions about outdoor-related activities
and weather-related queries.
`

const tools = [
    {
        functionDeclarations: [
            {
                name: "getCurrentWeather",
                description: "Returns the current weather of the location specified",
                parameters: {
                    type: "object",
                    // tell the LLM that the function requires one location parameter
                    properties: {
                        location: {
                            type: "string",
                            description: "City name or location"
                        }
                    },
                    // complusory to have a location parameter
                    required: ["location"]
                }
            },
            {
                name: "getLocation",
                description: "Returns the user's current location details. No parameters needed.",
                parameters: {
                    type: "object",
                    properties: {}
                }
            }
        ]
    }
]

/**
 * 
 * @param {*} role "user" for human, "model" for LLM, "function" is meant for observation
 * @param {*} content 
 * @returns 
 */
function createMessage(role, content) {
    // If content is already an array of parts, use it directly
    if (Array.isArray(content)) {
        return {
            role,
            parts: content
        };
    }

    // If it's a function response object with name and response
    if (role === 'function' && content.name && content.response !== undefined) {
        // force responseData data to be an object
        const responseData = (typeof content.response === 'object'
            && content.response !== null
            && !Array.isArray(content.response))
            ? content.response
            : { result: content.response };

        return {
            role: 'function',
            parts: [{
                functionResponse: {
                    name: content.name,
                    response: responseData
                }
            }]
        };
    }

    // Otherwise, wrap text content in a parts array
    return {
        role,
        parts: [{ text: content }]
    };
};

function startAgent(query) {
    // create the context
    const messages = [
        createMessage("user", query)
    ];

    const response = agentLoop(messages);
}

async function agentLoop(messages, maxIterations = 10) {
    for (let iterations = 0; iterations < maxIterations; iterations++) {
        console.log("-- iteration:", iterations);
        console.log("contents:", messages);
        // generateContent is an async operation
        const response = await ai.models.generateContent({
            model: MODEL,
            // JSON.stringify is to convert a JavaScript object into a JSON string
            contents: messages,
            config: {
                // system prompt has strong influence on the AI generation
                systemInstruction: reactAgentPrompt,
                tools
            }
        })
        // response will be an object with a `text` key
        console.log(response.text)

        // check if gemini wants to call any functions
        // Gemini will put the requests in functionCalls
        const functionCalls = response.functionCalls;

        // extract any other content from the response
        // ?. is the optional chaining operator
        // if any part of the expression before ?. is undefined or null
        // the entire expression shortcircuits to undefed
        const modelContent = response.candidates?.[0]?.content;

        // the above is a shorthand for below:
        // let modelContent;
        // if (response.candidates && response.candidates[0]) {
        //     modelContent = response.candidates[0].content;
        // }

        // if there any functions to call
        if (functionCalls && functionCalls.length > 0) {
            if (modelContent) {
                // if the tool request is accompanied by any other
                // text or data, add it to the context
                messages.push(modelContent);
            }

            // call each of the requested function
            // aka dispatch
            for (const call of functionCalls) {
                let observation = null;

                // sometimes, when Gemini requests function calls,
                // they will put a 'generic:', example: 'generic:getCurrentWeather'
                // 'generic:getCurrentWeather'.split(':') => ["generic", "getCurrentWeather"].pop() => 'getCurrentWeather
                const functionName = call.name.split(':').pop();
                console.log("function =>", functionName);
                if (functionName === "getLocation") {
                    observation = await getLocation();
                } else if (functionName === "getCurrentWeather") {
                    // the parameter will be call.args
                    observation = await getCurrentWeather(call.args.location);
                } else {
                    result = {
                        error: "Unknown function: " + call.name
                    }
                }

                console.log("Calling...", functionName);
                console.log("Observation =", observation);

                // add the observation back into the context
                messages.push(createMessage('function', {
                    name: call.name,
                    response: observation
                }))


            }
        } else {
            // gemini is not calling any function
            messages.push(modelContent);
        }

        // check if the agent has arrived at a final result
        // if the agent requests for a function, response.text won't exist
        if (response.text) {
            return response.text;
        }


    }
    return "The agent has reached maximum number of iterations without a final answer"
}

// async basically asynchronous operation
// it is used to refer functions that take a long
// time to run (few milliseconds)
async function main() {

    startAgent("I am now at Kyoto, Japan. Give me some ideas for outdoor activities");

}
main();