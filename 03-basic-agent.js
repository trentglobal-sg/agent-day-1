// import in our AI objects
// require - is to import from other files
// the first param to require is where to import from
// ./ -> current directory
const { ai, MODEL } = require('./gemini');
const { getCurrentWeather, getLocation } = require("./tools");

const reactAgentPrompt = `
You must return an array of responses. Each response has a "type" field which can be "thought", "action", or "result".

- If type is "thought": include a "content" field with your thinking as a string
- If type is "action": include a "function" field with the function name and "parameters" field with an array of parameters
- If type is "result": include a "content" field with the final answer as a string

You cycle through Thought, Action, Observation. At the end of the loop you output a final result.

Available actions:
- getCurrentWeather: 
    Returns the current weather of the location specified.
    Parameters: [location]
- getLocation:
    Returns user's location details. No arguments needed.
    Parameters: []

Example session:
Question: Please give me some ideas for activities to do this afternoon.

You return:
[
  { "type": "thought", "content": "I should look up the user's location so I can give location-specific activity ideas." },
  { "type": "action", "function": "getLocation", "parameters": [] }
]

You will be called again with observation, then you continue:
[
  { "type": "thought", "content": "Now I know the location is New York City. I should get the current weather." },
  { "type": "action", "function": "getCurrentWeather", "parameters": ["New York City"] }
]

After receiving weather observation, you output the final result:
[
  { "type": "result", "content": "Based on the sunny weather in New York City, here are some activity suggestions..." }
]
`

const schema = {
    // the response should be an array
    type: "array",
    // each element of the array is an object
    items: {
        type: "object",
        // what are the keys of the object
        properties: {
            type: {
                type: "string",
                enum: ["thought", "action", "result"]
            },
            content: { type: "string" },
            function: { type: "string" },
            parameters: {
                type: "array",
                items: { type: "string" }
            }
        },
        required: ["type"]
    }
}

/**
 * 
 * @param {*} role "user" for human, "model" for LLM, "function" is meant for observation
 * @param {*} content 
 * @returns 
 */
function createMessage(role, content) {
    return {
        role,
        parts: [
            {
                text: content
            }
        ]
    }
}

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
        // generateContent is an async operation
        const response = await ai.models.generateContent({
            model: MODEL,
            // JSON.stringify is to convert a JavaScript object into a JSON string
            contents: messages,
            config: {
                // system prompt has strong influence on the AI generation
                systemInstruction: reactAgentPrompt,
                // ensure valid JSON syntax
                responseMimeType: "application/json",
                responseSchema: schema
            }
        })
        // response will be an object with a `text` key
        console.log(response.text)

        // convert a JSON string into an actual JavaScript object
        const responseArray = JSON.parse(response.text);

        // for (r in responses):
        for (const r of responseArray) {
            // 2 == "2" => true
            if (r.type === "result") {
                return r.content;
            }

            // dispatch
            // call the functions that the AI is requesting
            if (r.type === "action") {
                console.log("Action:", r);
                let observation = null;
                if (r.function === "getLocation") {
                    observation = await getLocation();
                } else if (r.function === "getCurrentWeather") {
                    observation = await getCurrentWeather(r.parameters[0])
                } else {
                    observation = "Unknown function: " + r.function
                }
                console.log(`Observation: ${JSON.stringify(observation)}`);

                // todo: add the observation to the context
                messages.push(createMessage("model", response.text));
                messages.push(createMessage("user", `Observation: ${JSON.stringify(observation)}`))
            }
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