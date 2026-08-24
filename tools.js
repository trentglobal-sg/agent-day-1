async function getCurrentWeather() {
    // TODO: implement weather fetching logic
    return {
        temperature: 25,
        unit:"C",
        condition:"Rainy"
    }
}

async function getLocation() {
    // TODO: use a geolocation and reverse lookup
    return "Singapore, Yishun"
}

module.exports = {
    getCurrentWeather, getLocation
}