.pragma library

// Texts of this panel: written in Portuguese, English for every other locale.
var english = Qt.locale().name.indexOf("pt") !== 0
var en = {
 "Domingo": "Sunday",
 "Segunda": "Monday",
 "Terça": "Tuesday",
 "Quarta": "Wednesday",
 "Quinta": "Thursday",
 "Sexta": "Friday",
 "Sábado": "Saturday",
 "Amanhã": "Tomorrow",
 "Céu limpo": "Clear sky",
 "Quase limpo": "Mainly clear",
 "Parcialmente nublado": "Partly cloudy",
 "Nublado": "Cloudy",
 "Encoberto": "Overcast",
 "Neblina": "Fog",
 "Garoa": "Drizzle",
 "Garoa congelante": "Freezing drizzle",
 "Chuva fraca": "Light rain",
 "Chuva": "Rain",
 "Chuva forte": "Heavy rain",
 "Chuva congelante": "Freezing rain",
 "Chuva congelada": "Sleet",
 "Neve": "Snow",
 "Grãos de neve": "Snow grains",
 "Pancadas de chuva": "Rain showers",
 "Pancadas de neve": "Snow showers",
 "Trovoada": "Thunderstorm",
 "Trovoada com granizo": "Thunderstorm with hail",
 "Trocar a cidade": "Change city",
 "Buscar cidade": "Search for a city",
 "Usar a localização automática": "Use automatic location",
 "SENSAÇÃO": "FEELS LIKE",
 "UMIDADE": "HUMIDITY",
 "VENTO": "WIND",
 "Buscando a previsão…": "Fetching the forecast…",
 "PRÓXIMAS HORAS": "NEXT HOURS",
 "PRÓXIMOS DIAS": "NEXT DAYS"
}

function T(s) { return english && en[s] !== undefined ? en[s] : s }
