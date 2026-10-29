.import "Strings.js" as Strings
// weather.json holds {"name": ..., "latitude": ..., "longitude": ...} (see
// omarchy-weather-location, which owns the format). Missing, blank, or
// unparseable means the location is auto-detected from the IP address.
function parseLocationFile(raw) {
  var unset = { name: "", latitude: null, longitude: null }
  try {
    var data = JSON.parse(String(raw || ""))
    if (!data || typeof data !== "object") return unset

    var latitude = parseFloat(data.latitude)
    var longitude = parseFloat(data.longitude)
    var hasCoordinates = !isNaN(latitude) && !isNaN(longitude)
    return {
      name: typeof data.name === "string" ? data.name.replace(/^\s+|\s+$/g, "") : "",
      latitude: hasCoordinates ? latitude : null,
      longitude: hasCoordinates ? longitude : null
    }
  } catch (e) {
    return unset
  }
}

// wttr.in path segment for a configured location: exact coordinates when
// both are present, the URL-encoded name as a fallback (hand-edited
// weather.loc files may only carry a name), empty for IP auto-detect.
function wttrLocationQuery(location, latitude, longitude) {
  var lat = parseFloat(String(latitude))
  var lon = parseFloat(String(longitude))
  if (!isNaN(lat) && !isNaN(lon)) return lat + "," + lon

  var name = String(location || "").replace(/^\s+|\s+$/g, "")
  return name === "" ? "" : encodeURIComponent(name)
}

// Open-Meteo geocoding response → suggestion rows for the location picker.
function parseGeocodingResults(raw) {
  try {
    var data = JSON.parse(String(raw || "{}"))
    var results = data.results
    if (!results || !results.length) return []

    var out = []
    for (var i = 0; i < results.length; i++) {
      var r = results[i]
      if (!r || !r.name || r.latitude === undefined || r.longitude === undefined) continue
      var region = [r.admin1, r.country].filter(function(part) { return !!part }).join(", ")
      out.push({
        name: String(r.name),
        description: region,
        latitude: r.latitude,
        longitude: r.longitude
      })
    }
    return out
  } catch (e) {
    return []
  }
}

function locationCommit(text, suggestions, selectedIndex) {
  var name = String(text || "").replace(/^\s+|\s+$/g, "")
  if (name === "") return { name: "", latitude: null, longitude: null }

  var choices = suggestions || []
  var index = Math.max(0, Math.min(parseInt(selectedIndex, 10) || 0, choices.length - 1))
  var suggestion = choices[index]
  if (suggestion) return suggestion

  return { name: name, latitude: null, longitude: null }
}

function isFutureForecastDate(dateString, todayString) {
  if (!dateString) return false
  return String(dateString).slice(0, 10) > String(todayString || "")
}

function roundedTemp(value) {
  if (value === undefined || value === null || value === "") return ""
  var n = parseFloat(String(value))
  return isNaN(n) ? "" : String(Math.round(n))
}

function celsiusToFahrenheit(value) {
  if (value === undefined || value === null || value === "") return ""
  var n = parseFloat(String(value))
  return isNaN(n) ? "" : (n * 9 / 5) + 32
}

function formatTemp(value, useImperial) {
  if (value === undefined || value === null || value === "") return ""
  return value + "°" + (useImperial ? "F" : "C")
}

function normalizedUnit(value) {
  return String(value || "").replace(/^\s+|\s+$/g, "").toLowerCase()
}

function localeUsesImperial(localeName) {
  var name = String(localeName || "").replace(".", "_")
  return /^en[_-]US($|[_.-])/.test(name) || /^en[_-]LR($|[_.-])/.test(name) || /^my($|[_.-])/.test(name)
}

function countryUsesImperial(countryName) {
  var country = String(countryName || "")
    .replace(/^\s+|\s+$/g, "")
    .replace(/[._-]+/g, " ")
    .toLowerCase()
  if (!country) return null
  if (country === "us" || country === "usa" || country === "united states" || country === "united states of america") return true
  if (country === "liberia" || country === "myanmar" || country === "burma") return true
  return false
}

function shouldUseImperial(unitOverride, localeName, countryName) {
  var unit = normalizedUnit(unitOverride)
  if (unit === "imperial") return true
  if (unit === "metric") return false

  var countryPreference = countryUsesImperial(countryName)
  if (countryPreference !== null) return countryPreference

  return localeUsesImperial(localeName)
}

function dayName(dateString, formatter) {
  if (!dateString) return ""
  var d = new Date(dateString + "T12:00:00")
  if (isNaN(d.getTime())) return ""
  if (formatter) return formatter(d)
  return [Strings.T("Domingo"), Strings.T("Segunda"), Strings.T("Terça"), Strings.T("Quarta"), Strings.T("Quinta"), Strings.T("Sexta"), Strings.T("Sábado")][d.getDay()]
}

function openMeteoForecastDays(dailyForecastReport, todayString) {
  var daily = dailyForecastReport && dailyForecastReport.daily ? dailyForecastReport.daily : null
  if (!daily || !daily.time) return []

  var result = []
  for (var i = 0; i < daily.time.length && result.length < 3; ++i) {
    var date = daily.time[i]
    if (!isFutureForecastDate(date, todayString)) continue

    var maxC = daily.temperature_2m_max ? daily.temperature_2m_max[i] : ""
    var minC = daily.temperature_2m_min ? daily.temperature_2m_min[i] : ""
    result.push({
      date: date,
      maxtempC: roundedTemp(maxC),
      mintempC: roundedTemp(minC),
      maxtempF: roundedTemp(celsiusToFahrenheit(maxC)),
      mintempF: roundedTemp(celsiusToFahrenheit(minC)),
      openMeteoWeatherCode: daily.weather_code ? daily.weather_code[i] : null
    })
  }
  return result
}

// Open-Meteo bundles current conditions with the daily forecast request and
// answers far faster than wttr.in. Normalize them to wttr's
// current_condition shape so the panel can use either source
// interchangeably. Open-Meteo reports metric (°C, km/h).
function openMeteoCurrentCondition(dailyForecastReport) {
  var current = dailyForecastReport && dailyForecastReport.current ? dailyForecastReport.current : null
  if (!current || current.temperature_2m === undefined || current.temperature_2m === null) return null
  return {
    temp_C: roundedTemp(current.temperature_2m),
    temp_F: roundedTemp(celsiusToFahrenheit(current.temperature_2m)),
    FeelsLikeC: roundedTemp(current.apparent_temperature),
    FeelsLikeF: roundedTemp(celsiusToFahrenheit(current.apparent_temperature)),
    windspeedKmph: roundedTemp(current.wind_speed_10m),
    windspeedMiles: roundedTemp(current.wind_speed_10m * 0.621371),
    humidity: roundedTemp(current.relative_humidity_2m),
    openMeteoWeatherCode: current.weather_code,
    isDay: current.is_day
  }
}

function currentIcon(current, fallback) {
  if (!current) return fallback || ""
  if (current.openMeteoWeatherCode !== undefined && current.openMeteoWeatherCode !== null)
    return iconForOpenMeteoCode(current.openMeteoWeatherCode, Number(current.isDay) === 0)
  if (current.weatherCode !== undefined && current.weatherCode !== null)
    return iconForCode(current.weatherCode, false)
  return fallback || ""
}

// wttr.in has no day/night flag. Use its icon only to fill an empty initial
// state, never to replace a day/night-aware icon resolved by Open-Meteo.
function provisionalCurrentIcon(current, resolvedIcon) {
  return resolvedIcon || currentIcon(current, "")
}

function weatherResponseCompletesSave(hasConfiguredCoordinates, source) {
  return hasConfiguredCoordinates ? source === "open-meteo" : source === "wttr"
}

function wttrNextForecastDays(report, todayString) {
  var days = report && report.weather ? report.weather : []
  var result = []
  for (var i = 0; i < days.length && result.length < 3; ++i) {
    if (isFutureForecastDate(days[i].date, todayString)) result.push(days[i])
  }
  return result
}

function buildForecastDays(report, dailyForecastReport, todayString) {
  var days = openMeteoForecastDays(dailyForecastReport, todayString)
  return days.length > 0 ? days : wttrNextForecastDays(report, todayString)
}

function bareTempForDay(day, kind, useImperial) {
  if (!day) return ""
  var v = useImperial
    ? (kind === "max" ? day.maxtempF : day.mintempF)
    : (kind === "max" ? day.maxtempC : day.mintempC)
  if (v === undefined || v === null || v === "") return ""
  return v + "°"
}

function dayIcon(day) {
  if (!day) return ""
  if (day.openMeteoWeatherCode !== undefined && day.openMeteoWeatherCode !== null)
    return iconForOpenMeteoCode(day.openMeteoWeatherCode)
  if (!day.hourly || day.hourly.length === 0) return ""

  var best = day.hourly[0]
  var bestDist = 9999
  for (var i = 0; i < day.hourly.length; ++i) {
    var t = parseInt(String(day.hourly[i].time || "0"), 10)
    var dist = Math.abs(t - 1200)
    if (dist < bestDist) {
      bestDist = dist
      best = day.hourly[i]
    }
  }
  return iconForCode(best.weatherCode, false)
}

function iconForOpenMeteoCode(code, night) {
  var c = parseInt(String(code || "0"), 10)
  if (c === 0) return iconForCode(113, night)
  if (c === 1 || c === 2) return iconForCode(116, night)
  if (c === 3) return iconForCode(119, night)
  if (c === 45 || c === 48) return iconForCode(143, night)
  if (c === 51 || c === 53 || c === 55 || c === 56 || c === 57 || c === 61) return iconForCode(266, night)
  if (c === 63 || c === 65 || c === 66 || c === 67 || c === 80 || c === 81 || c === 82) return iconForCode(308, night)
  if (c === 71 || c === 73 || c === 75 || c === 77 || c === 85 || c === 86) return iconForCode(338, night)
  if (c === 95 || c === 96 || c === 99) return iconForCode(389, night)
  return iconForCode(119, night)
}

function iconForCode(code, night) {
  var c = parseInt(String(code || "0"), 10)
  switch (c) {
    case 113: return night ? "" : ""
    case 116: return night ? "" : ""
    case 119: case 122: return ""
    case 143: case 248: case 260: return night ? "\ue346" : "\ue313"
    case 176: case 263: case 353: return night ? "" : ""
    case 179: case 227: case 230: case 323: case 326: case 368: return night ? "" : ""
    case 182: case 185: case 281: case 284: case 311: case 314:
    case 317: case 320: case 350: case 362: case 365: case 374: case 377: return ""
    case 200: case 386: case 389: case 392: case 395: return ""
    case 266: case 293: case 296: case 299: case 302: case 305: case 308: case 356: case 359: return ""
    case 329: case 332: case 335: case 338: case 371: return ""
    default: return ""
  }
}

// Short weekday for the forecast row, in Portuguese without the "-feira"
// tail; the first future day reads "Amanhã".
function forecastDayLabel(dateString, todayString) {
  if (!dateString) return ""
  var d = new Date(dateString + "T12:00:00")
  if (isNaN(d.getTime())) return ""
  var t = new Date(String(todayString || "") + "T12:00:00")
  if (!isNaN(t.getTime()) && Math.round((d.getTime() - t.getTime()) / 86400000) === 1) return Strings.T("Amanhã")
  return dayName(dateString)
}

// Next hours for the hourly strip. Open-Meteo (requested with
// forecast_hours) starts at the current hour; that hour is the hero already,
// so the strip starts at the next one. wttr's 3-hourly slots fill in when
// Open-Meteo has not answered.
function hourlyForecast(dailyForecastReport, report, nowMs, limit) {
  var max = limit || 6
  var now = new Date(nowMs || Date.now())
  var out = []
  var hourly = dailyForecastReport && dailyForecastReport.hourly ? dailyForecastReport.hourly : null
  if (hourly && hourly.time) {
    var pad = function(n) { return (n < 10 ? "0" : "") + n }
    var nowKey = now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate())
      + "T" + pad(now.getHours()) + ":00"
    for (var i = 0; i < hourly.time.length && out.length < max; ++i) {
      var time = String(hourly.time[i])
      if (time <= nowKey) continue
      var tempC = hourly.temperature_2m ? hourly.temperature_2m[i] : ""
      out.push({
        hour: time.slice(11, 13) + "h",
        tempC: roundedTemp(tempC),
        tempF: roundedTemp(celsiusToFahrenheit(tempC)),
        icon: iconForOpenMeteoCode(hourly.weather_code ? hourly.weather_code[i] : 3,
                                   hourly.is_day ? Number(hourly.is_day[i]) === 0 : false)
      })
    }
    if (out.length > 0) return out
  }

  var days = report && report.weather ? report.weather : []
  for (var d = 0; d < days.length && out.length < max; ++d) {
    var slots = days[d].hourly || []
    for (var j = 0; j < slots.length && out.length < max; ++j) {
      var hhmm = parseInt(String(slots[j].time || "0"), 10)
      var when = new Date(String(days[d].date) + "T00:00:00")
      if (isNaN(when.getTime())) continue
      when.setHours(Math.floor(hhmm / 100))
      if (when.getTime() <= now.getTime()) continue
      var hour = Math.floor(hhmm / 100)
      out.push({
        hour: (hour < 10 ? "0" : "") + hour + "h",
        tempC: roundedTemp(slots[j].tempC),
        tempF: roundedTemp(slots[j].tempF),
        icon: iconForCode(slots[j].weatherCode, hour < 6 || hour >= 18)
      })
    }
  }
  return out
}

// Condition in words, from whichever source fed the hero.
function describeOpenMeteoCode(code) {
  var c = parseInt(String(code), 10)
  if (c === 0) return Strings.T("Céu limpo")
  if (c === 1) return Strings.T("Quase limpo")
  if (c === 2) return Strings.T("Parcialmente nublado")
  if (c === 3) return Strings.T("Nublado")
  if (c === 45 || c === 48) return Strings.T("Neblina")
  if (c === 51 || c === 53 || c === 55) return Strings.T("Garoa")
  if (c === 56 || c === 57) return Strings.T("Garoa congelante")
  if (c === 61) return Strings.T("Chuva fraca")
  if (c === 63) return Strings.T("Chuva")
  if (c === 65) return Strings.T("Chuva forte")
  if (c === 66 || c === 67) return Strings.T("Chuva congelante")
  if (c === 71 || c === 73 || c === 75) return Strings.T("Neve")
  if (c === 77) return Strings.T("Grãos de neve")
  if (c === 80 || c === 81 || c === 82) return Strings.T("Pancadas de chuva")
  if (c === 85 || c === 86) return Strings.T("Pancadas de neve")
  if (c === 95) return Strings.T("Trovoada")
  if (c === 96 || c === 99) return Strings.T("Trovoada com granizo")
  return ""
}

function describeWttrCode(code) {
  var c = parseInt(String(code), 10)
  switch (c) {
    case 113: return Strings.T("Céu limpo")
    case 116: return Strings.T("Parcialmente nublado")
    case 119: return Strings.T("Nublado")
    case 122: return Strings.T("Encoberto")
    case 143: case 248: case 260: return Strings.T("Neblina")
    case 176: case 263: case 266: case 293: case 296: case 353: return Strings.T("Chuva fraca")
    case 299: case 302: case 305: case 308: case 356: case 359: return Strings.T("Chuva")
    case 200: case 386: case 389: case 392: case 395: return Strings.T("Trovoada")
    case 179: case 227: case 230: case 323: case 326: case 329: case 332:
    case 335: case 338: case 368: case 371: return Strings.T("Neve")
    case 182: case 185: case 281: case 284: case 311: case 314: case 317:
    case 320: case 350: case 362: case 365: case 374: case 377: return Strings.T("Chuva congelada")
    default: return ""
  }
}

function describeCurrent(current) {
  if (!current) return ""
  if (current.openMeteoWeatherCode !== undefined && current.openMeteoWeatherCode !== null)
    return describeOpenMeteoCode(current.openMeteoWeatherCode)
  if (current.weatherCode !== undefined && current.weatherCode !== null)
    return describeWttrCode(current.weatherCode)
  return ""
}

// Nerd Font glyph (the bar label, kept for Island Bar) -> anatomy stroke icon
// key, the same table Island Bar uses.
function shapeForGlyph(glyph) {
  var g = String(glyph || "")
  if (g === "") return "cloud"
  var map = {
    "e30d": "sun", "e32b": "moon", "e302": "cloudSun", "e32e": "cloudSun", "e33d": "cloud",
    "e313": "fog", "e346": "fog", "e308": "rain", "e333": "rain", "e318": "rain",
    "e30a": "snow", "e327": "snow", "e31a": "snow", "e3ad": "snow", "e31d": "storm"
  }
  return map[g.charCodeAt(0).toString(16)] || "cloud"
}

if (typeof module !== "undefined") {
  module.exports = {
    parseLocationFile: parseLocationFile,
    wttrLocationQuery: wttrLocationQuery,
    parseGeocodingResults: parseGeocodingResults,
    locationCommit: locationCommit,
    isFutureForecastDate: isFutureForecastDate,
    roundedTemp: roundedTemp,
    celsiusToFahrenheit: celsiusToFahrenheit,
    formatTemp: formatTemp,
    normalizedUnit: normalizedUnit,
    localeUsesImperial: localeUsesImperial,
    countryUsesImperial: countryUsesImperial,
    shouldUseImperial: shouldUseImperial,
    dayName: dayName,
    openMeteoForecastDays: openMeteoForecastDays,
    openMeteoCurrentCondition: openMeteoCurrentCondition,
    currentIcon: currentIcon,
    provisionalCurrentIcon: provisionalCurrentIcon,
    weatherResponseCompletesSave: weatherResponseCompletesSave,
    wttrNextForecastDays: wttrNextForecastDays,
    buildForecastDays: buildForecastDays,
    bareTempForDay: bareTempForDay,
    dayIcon: dayIcon,
    iconForOpenMeteoCode: iconForOpenMeteoCode,
    iconForCode: iconForCode,
    forecastDayLabel: forecastDayLabel,
    hourlyForecast: hourlyForecast,
    describeOpenMeteoCode: describeOpenMeteoCode,
    describeWttrCode: describeWttrCode,
    describeCurrent: describeCurrent,
    shapeForGlyph: shapeForGlyph
  }
}
