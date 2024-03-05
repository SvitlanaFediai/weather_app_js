"use strict";

const API_KEY = "9d7c5e55a6a250a9e735b70f40151449";
const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const seasons = ["spring", "summer", "autumn", "winter"];

let dateEl = document.querySelector(".current__date"),
  timeEl = document.querySelector(".current__time"),
  currentLocation = document.querySelector(".current__location--text"),
  inputEl = document.getElementById("inputSearch"),
  historyBtnsContainer = document.querySelector(".search__history"),
  currentWeatherBtn = document.querySelector(".weather__forecast--hourly"),
  weekWeatherBtn = document.querySelector(".weather__forecast--week"),
  celciusBtn = document.querySelector(".weather__forecast--celcius"),
  fahrenheitBtn = document.querySelector(".weather__forecast--fahrenheit"),
  currentWeatherContainer = document.querySelector(".current__highlights"),
  weatherCard = document.querySelector(".weather__cards"),
  historyCities = JSON.parse(localStorage.getItem("saved")) || [],
  historyCurrentWeather =
    JSON.parse(localStorage.getItem("current-weather")) || [],
  historyDailyForecast =
    JSON.parse(localStorage.getItem("daily-forecast")) || [],
  defaultLat = "51.5072",
  defaultLng = "-0.1275",
  currentCity = "";

//Event listeners
inputEl.addEventListener("keypress", (e) => {
  if (e.keyCode === 13) {
    e.preventDefault();
    let currentCity = inputEl.value;
    if (currentCity) {
      console.log(currentCity);

      currentCity = currentCity[0].toUpperCase() + currentCity.slice(1);
      console.log(currentCity);
      let now = Math.round(new Date().getTime() / 1000),
        cityInList = historyCurrentWeather.filter(
          (e) => e.name === currentCity
        ),
        cacheTime = JSON.parse(localStorage.getItem("timestamp")),
        timeInterval = 7200; //2 hours * 60 sec

      console.log(cityInList);
      if (cityInList && cacheTime && cacheTime <= now - timeInterval) {
        displayCurrentForecast(cityInList);
        displayDailyForecast(cityInList);
      } else {
        localStorage.clear();
        getCurrentWeatherData(currentCity);
        getWeatherForecastForWeek(currentCity);
        setCacheTime();
        localStorage.setItem("unit", "celcius");
        changeUnit();
      }
    } else {
      alert("Please fill the field!");
    }
  }
});

celciusBtn.addEventListener("click", () => {
  localStorage.setItem("unit", "celcius");
  changeUnit();
  displayDailyForecast(currentCity);
});

fahrenheitBtn.addEventListener("click", () => {
  localStorage.setItem("unit", "fahrenheit");
  changeUnit();
  console.log(currentCity);
  displayDailyForecast(currentCity);
});

document.addEventListener("DOMContentLoaded", function () {
  getDateTime();
  setInterval(getDateTime, 1000);
  changeBackground();

  getLocation();
});

function changeBackground() {
  const getSeason = (m) => Math.floor((m.getMonth() / 12) * 4) % 4;
  document.body.style.background =
    "linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url(./img/" +
    seasons[getSeason(new Date())] +
    "_bg.jpg)";
  document.body.style.backgroundRepeat = "no-repeat";
  document.body.style.backgroundSize = "cover";
  document.body.style.backgroundPosition = "center";
  console.log(seasons[getSeason(new Date())]);
}

//function to get date and time
function getDateTime() {
  let now = new Date(),
    year = now.getFullYear(),
    month = now.getMonth(),
    date = now.getDate(),
    day = now.getDay(),
    hour = now.getHours(),
    minute = now.getMinutes(),
    ampm = hour >= 12 ? "PM" : "AM";

  hour = hour % 12;
  if (hour < 10) {
    hour = "0" + hour;
  }
  if (minute < 10) {
    minute = "0" + minute;
  }
  dateEl.innerText = days[day] + ", " + date + " " + months[month] + " " + year;

  timeEl.innerHTML = `${hour}:${minute}` + `<span class="pm-am">${ampm}</span>`;
}

//Get location
function getLocation() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      // Success callback function
      (position) => {
        // Get the user's latitude and longitude coordinates
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        displayLocation(lat, lng);
        console.log(`Latitude: ${lat}, longitude: ${lng}`);
      },
      (error) => {
        // Handle errors, e.g. user denied location sharing permissions
        console.error("Error getting user location:", error);
        displayLocation(defaultLat, defaultLng);
        showWarning(
          "Geolocation has not been determined, the page has loaded with default location - London"
        );
      }
    );
  } else {
    // Geolocation is not supported by the browser
    console.error("Geolocation is not supported by this browser.");
    showWarning("Geolocation is not supported by this browser.");
  }
}

async function displayLocation(lat, lng) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lng}&appid=${API_KEY}`
    );
    const data = await response.json();

    console.log(data);
    currentLocation.textContent = `${data[0].name}, ${data[0].country}`;
    currentCity = data[0].name;
    console.log(currentCity);
    console.log(localStorage.getItem("unit"));

    getCurrentWeatherData(currentCity);
    getWeatherForecastForWeek(currentCity);
    setCacheTime();
    drawCityBtn();
  } catch (err) {
    console.error(err);
  }
}

async function getCurrentWeatherData(city) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`
    );
    const data = await response.json();
    setToLocaleStorageCurrentWeather(data);
    displayCurrentForecast(data.name);
  } catch (error) {
    console.error("Error fetching data:", error);
    showWarning(error);
    if ((error = 404)) {
      showWarning(
        `There is ${city} not found in our database. Please, check the entered data is correct`
      );
    }
  }

  inputEl.value = "";
}

async function getWeatherForecastForWeek(city) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`
    );
    const data = await response.json();
    setToLocaleStorageDailyForecast(data);
    console.log(data.city.name);
    displayDailyForecast(data.city.name);
  } catch (error) {
    console.error("Error fetching data:", error);
    showWarning(error);
  }
}

function displayCurrentForecast(city) {
  currentWeatherContainer.innerHTML = "";

  let filterCity = historyCurrentWeather.filter((e) => e.name === city),
    timezone = filterCity[0].timezone,
    sunrise = new Date((filterCity[0].sys.sunrise + timezone) * 1000)
      .toUTCString()
      .slice(5, 22),
    sunset = new Date((filterCity[0].sys.sunset + timezone) * 1000)
      .toUTCString()
      .slice(5, 22);

  console.log(filterCity, sunrise);

  currentLocation.textContent = `${filterCity[0].name}, ${filterCity[0].sys.country}`;
  currentWeatherContainer.innerHTML = `<h2>Current weather</h2>
                                        <p>Temperature: ${filterCity[0].main.temp.toFixed(
                                          1
                                        )} °C</p>
                                        <p>Feels like: ${filterCity[0].main.feels_like.toFixed(
                                          1
                                        )} °C</p>
                                        <p>Sunrise: ${sunrise} </p>
                                        <p>Sunset: ${sunset} </p>
                                      `;
}

function displayDailyForecast(city) {
  weatherCard.innerHTML = "";
  console.log(city, currentCity);
  currentCity = city;
  let filterCity = historyDailyForecast.filter(
    (el) => el.city.name === currentCity
  );
  console.log(filterCity, historyDailyForecast[0].city.name);

  let arrayList = filterCity[0].list;
  console.log(arrayList);
  for (var i = 0; i < arrayList.length; i++) {
    if (arrayList[i].dt_txt.split(" ")[1] === "12:00:00") {
      console.log(arrayList[i]);

      let date = new Date(arrayList[i].dt * 1000),
        weekday = date.toLocaleDateString("en", { weekday: "long" }),
        day = date.toLocaleDateString("en", { day: "numeric", month: "short" }),
        temperature = celciusToFahrenheit(arrayList[i].main.temp),
        description = arrayList[i].weather[0].description,
        dayCard = document.createElement("div");
      dayCard.classList.add("weather__cards--item");

      dayCard.innerHTML = `
                          <p class="weather__cards--day">${weekday}</p>
                          <p class="weather__cards--date">${day}</p>
                          <img src="http://openweathermap.org/img/wn/${arrayList[i].weather[0].icon}@2x.png" alt="weather icon" class="w-icon">
                          <p class="temperature">${temperature}</p>
                          <p class="description">${description}</p>
                          `;
      weatherCard.appendChild(dayCard);
    }
  }
}

function changeUnit() {
  if (
    localStorage.getItem("unit") === "celcius" ||
    localStorage.getItem("unit") === null
  ) {
    celciusBtn.classList.add("active");
    fahrenheitBtn.classList.remove("active");
  } else {
    celciusBtn.classList.remove("active");
    fahrenheitBtn.classList.add("active");
  }
  console.log(currentCity);
}

function celciusToFahrenheit(temp) {
  let tempUnit = "";
  if (localStorage.getItem("unit") === "fahrenheit") {
    tempUnit = "°F";
    return ((temp * 9) / 5 + 32).toFixed(1) + tempUnit;
  } else {
    tempUnit = "°C";
    return temp.toFixed(1) + tempUnit;
  }
  //return ((temp * 9) / 5 + 32).toFixed(1);
}

function setToLocaleStorageCurrentWeather(data) {
  let sameCityName = historyCurrentWeather.some((el) => el.name === data.name);

  console.log(sameCityName);
  if (data.name === null || data.name === undefined) {
    return;
  } else if (!sameCityName) {
    historyCurrentWeather.push(data);
    localStorage.setItem(
      "current-weather",
      JSON.stringify(historyCurrentWeather)
    );
    drawCityBtn();
  }
}

function setToLocaleStorageDailyForecast(data) {
  console.log(data, data.city.name);
  let sameCityName = historyDailyForecast.some(
    (el) => el.city.name === data.city.name
  );
  if (!sameCityName) {
    historyDailyForecast.push(data);
    localStorage.setItem(
      "daily-forecast",
      JSON.stringify(historyDailyForecast)
    );
  }
}

function setCacheTime() {
  let cacheTime = Math.round(new Date().getTime() / 1000);
  localStorage.setItem("timestamp", JSON.stringify(cacheTime));
}

function drawCityBtn() {
  historyBtnsContainer.replaceChildren();

  let titleEl = document.createElement("h4");
  titleEl.textContent = "Recently searched cities:";
  historyBtnsContainer.prepend(titleEl);

  for (let i = 0; i < historyCurrentWeather.length; i++) {
    let liEl = document.createElement("li"),
      cityBtn = document.createElement("button"),
      delBtn = document.createElement("button");

    liEl.className = "search__history--item";

    cityBtn.textContent = historyCurrentWeather[i].name;
    cityBtn.setAttribute("id", "relook");
    cityBtn.classList.add("search__history--btn");

    delBtn.innerHTML = `<i class="fa-solid fa-xmark"></i>`;
    delBtn.className = "search__history--del";
    delBtn.setAttribute("id", `${historyCurrentWeather[i].name}`);

    liEl.append(cityBtn, delBtn);
    historyBtnsContainer.appendChild(liEl);
  }

  let cityBtnFromHistory = document.querySelectorAll(".search__history--btn");
  console.log(cityBtnFromHistory);
  cityBtnFromHistory.forEach((element) => {
    element.addEventListener("click", function () {
      currentCity = this.textContent;
      console.log(currentCity);

      displayCurrentForecast(currentCity);
      displayDailyForecast(currentCity);
    });
  });

  let deleteBtns = document.querySelectorAll(".search__history--del");
  console.log(deleteBtns);
  deleteBtns.forEach((element) => {
    element.addEventListener("click", deleteCityFromLocaleStorage);
  });
}

function deleteCityFromLocaleStorage() {
  let i = historyCurrentWeather.findIndex((el) => el.name === this.id),
    dailyIndex = historyDailyForecast.findIndex(
      (el) => el.city.name === this.id
    );
  console.log(i, this.id);

  historyCurrentWeather.splice(i, 1);
  historyDailyForecast.splice(dailyIndex, 1);

  localStorage.setItem(
    "current-weather",
    JSON.stringify(historyCurrentWeather)
  );
  localStorage.setItem("daily-forecast", JSON.stringify(historyDailyForecast));

  drawCityBtn();
}

function showWarning(message) {
  var dialog = document.createElement("div"),
    dialogOverlay = document.createElement("div");

  dialogOverlay.className = "dialog-overlay";
  dialog.className = "dialog";

  dialog.innerHTML = `<p>${message}</p>`;

  document.body.append(dialogOverlay, dialog);

  setTimeout(function () {
    dialogOverlay.remove();
    dialog.remove();
  }, 3000);
}
