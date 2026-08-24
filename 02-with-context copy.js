// import in our AI objects
// require - is to import from other files
// the first param to require is where to import from
// ./ -> current directory
const { ai, MODEL} = require('./gemini');
const { getCurrentWeather, getLocation} = require("./tools");

// async basically asynchronous operation
// it is used to refer functions that take a long
// time to run (few milliseconds)
async function main() {

    const weather = await getCurrentWeather();
    const location = await getLocation();

    // generateContent is an async operation
    const response = await ai.models.generateContent({
        model: MODEL,
        // JSON.stringify is to convert a JavaScript object into a JSON string
        contents: `Give me a list of outdoor activities to today based on my current location and weather
            Current weather: ${JSON.stringify(weather)} Current location: ${location}
        `
    })
    // response will be an object with a `text` key
    console.log(response.text)
}
main();