// import in our AI objects
// require - is to import from other files
// the first param to require is where to import from
// ./ -> current directory
const { ai, MODEL} = require('./gemini');

// async basically asynchronous operation
// it is used to refer functions that take a long
// time to run (few milliseconds)
async function main() {
    // generateContent is an async operation
    const response = await ai.models.generateContent({
        model: MODEL,
        contents: "Give me a list of outdoor activities to today based on my current location and weather"
    })
    // response will be an object with a `text` key
    console.log(response.text)
}
main();