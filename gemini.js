// require is the same as import in Python
// it is used to import in variables and functions from other dependencies and files
// the default path to import from is node_modules
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

// an object in JavaScript is the same as a dictionary in Python (mostly)
// differences:
// all keys in a JavaScript object are strings
// you can use the dot syntax to access keys in JavaScript objects
const ai = new GoogleGenAI({
    // process is a global nodejs variable
    // it contains information about the environment (aka the OS)
    apiKey: process.env.GEMINI_API_KEY
})

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

module.exports = {
    ai, MODEL
}