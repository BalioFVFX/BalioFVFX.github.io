const TEMPERATURE_SYMBOL = "&#176"
const BULLET_SYMBOL = "&#8226;"
const FAV_CITIES_KEY = "FV_CITIES"
const API_KEY = "d7a9fbb5822048878253013061d1c1f1"
const DEFAULT_CITY = {
    "id": 727011,
    "name": "Sofia",
    "lat": 42.6975,
    "lon": 23.3242
}

let currentCity = DEFAULT_CITY

$(document).ready(function () {

    $('#city-title').html(DEFAULT_CITY.name)

    updateFavoriteState(DEFAULT_CITY)
    applyToday(DEFAULT_CITY)

    $("#add-remove-favourite-image").click(function () {

        let isLiked = isCityFavorite(currentCity)

        if (isLiked) {
            removeFromFavorites(currentCity)
            $("#add-remove-favourite-image").attr("src", "img\\intertact\\heart_off.svg")
        } else {
            addToFavorites(currentCity)
            $("#add-remove-favourite-image").attr("src", "img\\intertact\\heart_on.svg")
        }
    })

    $('#search-city-input').keypress(function (event) {
        if (event.which === 13) {
            city = $('#search-city-input').val()

            getWeatherForCity(city, function (result) {
                if (result === null || result.cod !== 200) {
                    handleError(result.message)
                    return false
                }

                updateCurrentCity(result.id, result.name, result.coord.lat, result.coord.lon)
                getWeatherHourly(result.coord.lat, result.coord.lon, updateForecastHourly)
                updateWeatherInfoSection(result.main.temp, result.weather[0].icon, result.weather[0].description);
                updateSunriseSunset(result.sys.sunrise, result.sys.sunset, result.timezone)
                updateFavoriteState(currentCity)
                updateTimestamp(result.dt, result.timezone)
                selectButton("#button-today")

                $('#search-city-input').val("")
                $('#city-title').html(result.name)
            })
            return false``
        }
    })

    selectButton('#button-today')

    $('#button-today').click(function () {
        selectButton('#button-today')
        applyToday(currentCity)
    })

    $('#button-tomorrow').click(function () {
        selectButton('#button-tomorrow')
        applyTomorrow(currentCity)
    })

    $('#button-five-days').click(function () {
        selectButton('#button-five-days')
        applyFiveDays(currentCity)
    })

})

function selectButton(id) {
    $('#button-today').removeClass('active-button')
    $('#button-tomorrow').removeClass('active-button')
    $('#button-five-days').removeClass('active-button')
    $(id).addClass('active-button')
}

function applyToday(location) {
    getWeatherForCity(location.name, function (result) {
        if (result === null || result.cod !== 200) {
            handleError(result.message)
            return
        }

        getWeatherHourly(result.coord.lat, result.coord.lon, updateForecastHourly)
        updateCurrentCity(result.id, result.name, result.coord.lat, result.coord.lon)
        updateWeatherInfoSection(result.main.temp, result.weather[0].icon, result.weather[0].description);
        updateSunriseSunset(result.sys.sunrise, result.sys.sunset, result.timezone)
        updateTimestamp(result.dt, result.timezone)
        updateFavoriteState(currentCity)
    })
}

function applyTomorrow(location) {
    getWeatherForTomorrow(location.lat, location.lon, updateForecastHourlyTomorrow)
}

function applyFiveDays(location) {
    getWeatherForFiveDays(location.lat, location.lon, function (response) {
        if (response === null || response.cod !== 200) {
            handleError(response.message)
            return false
        }
        updateForecastDaily(response)
    })
}

function getWeatherForTomorrow(lat, lon, callback) {
    console.log(`Fetching Tomorrow weather: ${lat}, ${lon}`)
    $.ajax({
        url: `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&appid=${API_KEY}&exclude=minutely,daily&units=metric`,
        type: "GET",
        success: function (response) {

            let firstMeasure = new Date((response.hourly[0].dt + response.timezone_offset) * 1000)
            let counter = 0

            let currentIndex = firstMeasure.getUTCHours()

            while(true){
                if(currentIndex >= 24){
                    currentIndex = 0
                }
                if(currentIndex === 7){
                    break
                }
                currentIndex++
                counter++
            }

            let result = {
                "measures": [
                    {
                        "timestamp": response.hourly[counter].dt,
                        "temp": response.hourly[counter].temp,
                        "description": response.hourly[counter].weather[0].description,
                        "icon": response.hourly[counter].weather[0].icon
                    },
                    {
                        "timestamp": response.hourly[counter + 3].dt,
                        "temp": response.hourly[counter + 3].temp,
                        "description": response.hourly[counter + 3].weather[0].description,
                        "icon": response.hourly[counter + 3].weather[0].icon
                    },

                    {
                        "timestamp": response.hourly[counter + 6].dt,
                        "temp": response.hourly[counter + 6].temp,
                        "description": response.hourly[counter + 6].weather[0].description,
                        "icon": response.hourly[counter + 6].weather[0].icon
                    },
                    {
                        "timestamp": response.hourly[counter + 9].dt,
                        "temp": response.hourly[counter + 9].temp,
                        "description": response.hourly[counter + 9].weather[0].description,
                        "icon": response.hourly[counter + 9].weather[0].icon
                    },

                    {
                        "timestamp": response.hourly[counter + 12].dt,
                        "temp": response.hourly[counter + 12].temp,
                        "description": response.hourly[counter + 12].weather[0].description,
                        "icon": response.hourly[counter + 12].weather[0].icon
                    }
                ],
                "timezone": response.timezone_offset
            }
            console.log("Forecast Tomorrow days fetched")
            callback(result)

        },
        error: function (request, status, error) {
            console.log("Error while fetching Forecast 5 days fetched")
            let json = JSON.parse(request.responseText)
            callback(json)
        }
    })
}

function getWeatherForFiveDays(lat, lon, callback) {
    console.log(`Fetching 5 days weather: ${lat}, ${lon}`)
    $.ajax({
        url: `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&appid=${API_KEY}&exclude=minutely,hourly&units=metric`,
        type: "GET",
        success: function (response) {
            let result = {
                "measures": [
                    {
                        "timestamp": response.daily[0].dt,
                        "temp": (response.daily[0].temp.min + response.daily[0].temp.max) / 2,
                        "description": response.daily[0].weather[0].description,
                        "icon": response.daily[0].weather[0].icon
                    },
                    {
                        "timestamp": response.daily[1].dt,
                        "temp": (response.daily[1].temp.min + response.daily[1].temp.max) / 2,
                        "description": response.daily[1].weather[0].description,
                        "icon": response.daily[1].weather[0].icon
                    },

                    {
                        "timestamp": response.daily[2].dt,
                        "temp": (response.daily[2].temp.min + response.daily[2].temp.max) / 2,
                        "description": response.daily[2].weather[0].description,
                        "icon": response.daily[2].weather[0].icon
                    },
                    {
                        "timestamp": response.daily[3].dt,
                        "temp": (response.daily[3].temp.min + response.daily[3].temp.max) / 2,
                        "description": response.daily[3].weather[0].description,
                        "icon": response.daily[3].weather[0].icon
                    },

                    {
                        "timestamp": response.daily[4].dt,
                        "temp": (response.daily[4].temp.min + response.daily[4].temp.max) / 2,
                        "description": response.daily[4].weather[0].description,
                        "icon": response.daily[4].weather[0].icon
                    }
                ],
                "timezone": response.timezone_offset,
                "cod": 200
            }
            console.log("Forecast 5 days fetched")
            callback(result)

        },
        error: function (request, status, error) {
            console.log("Error while fetching Forecast 5 days fetched")
            let json = JSON.parse(request.responseText)
        }
    })
}

function updateForecastHourlyTomorrow(response) {
    let offset = response.timezone

    for (let i = 0; i < response.measures.length; i++) {
        let date = new Date((response.measures[i].timestamp + offset) * 1000)

        let measureTime =  getStringTimeFromDate(new Date((response.measures[i].timestamp + offset) * 1000))
        let icon = getWeatherImage(response.measures[i].icon)
        let temperature = Math.floor(response.measures[i].temp) + TEMPERATURE_SYMBOL

        $(`.container-forecast .forecast-widget:nth-child(${i + 1}) .forecast-timestamp`).html(measureTime)
        $(`.container-forecast .forecast-widget:nth-child(${i + 1}) .forecast-widget-image`).attr('src', icon).attr("alt", "weather visualization")
        $(`.container-forecast .forecast-widget:nth-child(${i + 1}) .forecast-temperature`).html(temperature)
    }
}

function updateForecastHourly(response) {
    let offset = response.timezone

    for (let i = 0; i < response.measures.length; i++) {
        let measureTime = getStringTimeFromDate(new Date((response.measures[i].timestamp + offset) * 1000))
        let icon = getWeatherImage(response.measures[i].icon)
        let temperature = Math.floor(response.measures[i].temp) + TEMPERATURE_SYMBOL

        $(`.container-forecast .forecast-widget:nth-child(${i + 1}) .forecast-timestamp`).html(measureTime)
        $(`.container-forecast .forecast-widget:nth-child(${i + 1}) .forecast-widget-image`).attr('src', icon).attr("alt", "weather visualization")
        $(`.container-forecast .forecast-widget:nth-child(${i + 1}) .forecast-temperature`).html(temperature)
    }
}

function updateForecastDaily(response) {
    let offset = response.timezone

    for (let i = 0; i < response.measures.length; i++) {
        let measureTime = getMonthDayYearTimestamp(new Date((response.measures[i].timestamp + offset) * 1000), false, true)
        let icon = getWeatherImage(response.measures[i].icon)
        let temperature = Math.floor(response.measures[i].temp) + TEMPERATURE_SYMBOL

        $(`.container-forecast .forecast-widget:nth-child(${i + 1}) .forecast-timestamp`).html(measureTime)
        $(`.container-forecast .forecast-widget:nth-child(${i + 1}) .forecast-widget-image`).attr('src', icon).attr("alt", "weather visualization")
        $(`.container-forecast .forecast-widget:nth-child(${i + 1}) .forecast-temperature`).html(temperature)
    }
}

function updateCurrentCity(id, name, lat, lon) {
    currentCity = {
        "id": id,
        "name": name,
        "lat": lat,
        "lon": lon
    }
}

function handleError(error) {
    $("#error").text(`Error: ${error}`)
    $(".error-container").fadeIn().delay(2500).fadeOut()
}

function addToFavorites(city) {
    console.log("ADDING TO FAVORITES")
    let favorites = getFavorites()

    favorites.locations.push(city)

    localStorage.setItem(FAV_CITIES_KEY, JSON.stringify(favorites))
}

function removeFromFavorites(city) {
    console.log("REMOVING FROM FAVORITES")
    let favorites = getFavorites()

    favorites.locations = favorites.locations.filter(function (loc) {
        return loc.id !== city.id
    })

    localStorage.setItem(FAV_CITIES_KEY, JSON.stringify(favorites))
}

function getWeatherForCity(cityName, callback) {
    $.ajax({
        url: `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${API_KEY}&units=metric`,
        type: "GET",
        success: function (result) {
            callback(result)
        },
        error: function (request, status, error) {
            let json = JSON.parse(request.responseText)
            callback(json)
        }
    })
}

function getWeatherHourly(lat, long, callback) {
    console.log(`Fetching hourly weather: ${lat}, ${long}`)
    $.ajax({
        url: `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${long}&appid=${API_KEY}&exclude=minutely,daily&units=metric`,
        type: "GET",
        success: function (response) {
            let result = {
                "measures": [
                    {
                        "timestamp": response.hourly[0].dt,
                        "temp": response.hourly[0].temp,
                        "description": response.hourly[0].weather[0].description,
                        "icon": response.hourly[0].weather[0].icon
                    },
                    {
                        "timestamp": response.hourly[3].dt,
                        "temp": response.hourly[3].temp,
                        "description": response.hourly[3].weather[0].description,
                        "icon": response.hourly[3].weather[0].icon
                    },

                    {
                        "timestamp": response.hourly[6].dt,
                        "temp": response.hourly[6].temp,
                        "description": response.hourly[6].weather[0].description,
                        "icon": response.hourly[6].weather[0].icon
                    },
                    {
                        "timestamp": response.hourly[9].dt,
                        "temp": response.hourly[9].temp,
                        "description": response.hourly[9].weather[0].description,
                        "icon": response.hourly[9].weather[0].icon
                    },

                    {
                        "timestamp": response.hourly[12].dt,
                        "temp": response.hourly[12].temp,
                        "description": response.hourly[12].weather[0].description,
                        "icon": response.hourly[12].weather[0].icon
                    }
                ],
                "timezone": response.timezone_offset
            }
            console.log("Forecast hourly fetched")
            callback(result)

        },
        error: function (request, status, error) {
            console.log("Error while fetching Forecast 5 days fetched")
            let json = JSON.parse(request.responseText)
            callback(json)
        }
    })
}

function getFavorites() {
    let json = localStorage.getItem(FAV_CITIES_KEY)

    if (json === null) {

        let empty = {
            "locations": []
        }

        localStorage.setItem(FAV_CITIES_KEY, JSON.stringify(empty))

        return {
            "locations": []
        }
    }
    return JSON.parse(json)

}

function isCityFavorite(city) {
    let favorite = getFavorites()

    let i
    for (i = 0; i < favorite.locations.length; i++) {
        if (city.id === favorite.locations[i].id) {
            return true
        }
    }

    return false
}

function updateFavoriteState(city) {
    $("#add-remove-favourite-image").attr("src", getFavouriteIconState(city)).attr("alt", "favorite-state")
}

function getFavouriteIconState(place) {
    let isLiked = isCityFavorite(place)

    if (isLiked) {
        return "img\\intertact\\heart_on.svg"
    } else {
        return "img\\intertact\\heart_off.svg"
    }
}

function updateWeatherInfoSection(temp, icon, description) {
    $('#temperature-title').html(Math.floor(temp) + TEMPERATURE_SYMBOL)
    $('#weather-image').attr("src", getWeatherImage(icon)).attr("alt", "weather visualization")
    $('#weather-description').html(description)

}

function getMonthDayYearTimestamp(date, appendBullet, fullLength) {
    let day = date.getUTCDate()
    let month = date.getUTCMonth()
    let year = date.getFullYear()

    let result = ""

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    let bullet
    if (appendBullet) {
        bullet = BULLET_SYMBOL
    } else {
        bullet = ""
    }

    let monthName

    if(fullLength){
        monthName = monthNames[month]
    }
    else{
        monthName = monthNames[month].substr(0, 3) + "."
    }

    result += `${monthName} ${day} ${bullet} ${year}`

    return result
}

function getStringTimestampFromDate(date) {
    let result = ""
    let hourMinute = getStringTimeFromDate(date)
    let monthDayYear = getMonthDayYearTimestamp(date, true, true)

    result += `${hourMinute} ${BULLET_SYMBOL} ${monthDayYear}`

    return result
}

function getStringTimeFromDate(date) {
    let hour = date.getUTCHours()
    let minute = date.getUTCMinutes()

    let result = ""

    if (hour < 10) {
        result += "0"
    }

    result += hour + ":"

    if (minute < 10) {
        result += "0"
    }

    result += minute

    if (hour < 12) {
        result += " AM"
    }

    return result
}

function updateSunriseSunset(sunriseTimestamp, sunsetTimestamp, timezone) {
    let sunriseDate = new Date((sunriseTimestamp + timezone) * 1000)
    let sunsetDate = new Date((sunsetTimestamp + timezone) * 1000)

    $('#sunrise-timestamp').html(getStringTimeFromDate(sunriseDate))
    $('#sunset-timestamp').html(getStringTimeFromDate(sunsetDate))
}

function updateTimestamp(date, timezone) {
    $('#timestamp').html(getStringTimestampFromDate(new Date((date + timezone) * 1000)))
}

function getWeatherImage(weatherType) {

    let time = ""
    let type = ""

    switch (weatherType.substring(0, 2)) {
        case '01':
            type = "clear"
            break
        case '02':
            type = "partial_cloud"
            break;
        case '03':
            type = "cloudy"
            break;
        case '04':
            type = "cloudy"
            break;
        case '09':
            type = "rain"
            break;
        case '10':
            type = "rain"
            break;
        case '11':
            type = "thunder"
            break;
        case '13':
            type = "snow"
            break;
        case '50':
            type = "mist"
            break;
        default:
            type = "clear"
    }

    if (weatherType.substr(2, 3) === 'd') {
        time = "day"
    } else {
        time = "night"
    }

    return `img\\weather\\${time}_${type}.png`
}