let currentPage = 1
let cities = null
let lastItem = 0
const ITEMS_PER_PAGE = 5

$(document).ready(function () {

    let favorites = getFavorites()

    if (favorites.locations.length === 0) {
        updateEmptyImageState()
    } else {
        let items = favorites.locations.map(function (element) {
            return String(element.id)
        }).join(",")

        getWeatherForMultipleLocations(items)
    }

    $('#pagination-left').click(function () {
        updatePage(currentPage - 1)
    })
    $('#pagination-right').click(function () {
        updatePage(currentPage + 1)
    })

})

function updatePage(page) {
    console.log("WANT TO REDIRECT TO " + page + " page")
    if (cities === null || cities.length === 0) {
        $('#favorites-list').empty()
        $('#empty-container').show()
        return
    }

    $('#empty-container').hide()

    if (page <= 0) {
        return;
    }

    let endIndex = (page * ITEMS_PER_PAGE)
    let startIndex = endIndex - ITEMS_PER_PAGE

    if (lastItem >= cities.length - 1 && page > currentPage && currentPage !== page) {
        return;
    }

    endIndex = Math.max(0, endIndex - 1)
    startIndex = Math.max(0, startIndex)


    if (startIndex >= cities.length) {
        startIndex = cities.length - 1
        if (startIndex < 0) {
            startIndex = 0
        }
    }

    if (endIndex >= cities.length) {
        endIndex = cities.length - 1
    }

    $('#favorites-list').empty()

    var i
    for (i = startIndex; i <= endIndex; i++) {
        let name = cities[i].name
        let temperature = cities[i].main.temp
        let weatherImage = getWeatherImage(cities[i].weather[0].icon)

        let listItem = $(`<li>
                <img src="${weatherImage}" class="favorite-location-weather-image" alt="weather type image" />
                <h2 id="${cities[i].id}">${name} <p class="temperature">${temperature}${TEMPERATURE_SYMBOL}</p></h2>
                <img src="img/intertact/heart_on.svg" class="heart-image" alt="dislike"/>
            </li>`)

        listItem.children(`.heart-image`).click(function () {
            let locationId = parseInt(listItem.children('h2').attr('id'))
            let location = {
                "id": locationId
            }

            removeFromFavorites(location)

            cities = cities.filter(function (element) {
                return element.id !== locationId
            })

            updatePage(currentPage)
        })

        $('#favorites-list').append(listItem)
    }

    currentPage = page
    lastItem = endIndex

}

function getWeatherForMultipleLocations(locations) {
    $.ajax({
        url: `https://api.openweathermap.org/data/2.5/group?id=${locations}&appid=${API_KEY}&units=metric`,
        type: "GET",
        success: function (result) {
            cities = result.list
            console.log(cities)
            currentPage = 1
            updatePage(currentPage)
        },
        error: function (request, status, error) {
        }
    })
}

function updateEmptyImageState() {
    let favorites = getFavorites()

    if (favorites.locations.length === 0) {
        $('#empty-container').show()
    } else {
        $('#empty-container').hide()
    }
}