var Clay = require('pebble-clay');
var clayConfig = require('./config');
var clay = new Clay(clayConfig);  

var xhrRequest = function (url, type, callback) {
  var xhr = new XMLHttpRequest();
  xhr.onload = function () {
    callback(this.responseText);
  };
  xhr.open(type, url);
  xhr.send();
};

function setPos(pos) {
  console.log("Success -- setting coords")
  window.LAT = pos.coords.latitude;
  window.LON = pos.coords.longitude;
  getWeather(window.units, window.fio_key);
}

function noSetPos(pos) {
  console.log("Failed getting location -- using default coordinates if possible")
  if (window.LAT && window.LON) {
	  getWeather(window.units, window.fio_key);
  } else {
	  console.log("No default coordinates set.")
  }
}

function getWeather(units, key) {
	var base = "https://api.forecast.io/forecast/";
	var exclude = "?exclude=minutely,hourly,daily,flags"
	var punits = "&units=" + units;
	var url = base + key + "/" + window.LAT +"," + window.LON + exclude + punits;
	xhrRequest(url, 'GET', 
	    function(responseText) {
			var json = JSON.parse(responseText);

			if (json.currently !== undefined && json.currently.apparentTemperature) {
				var temperature = json.currently.apparentTemperature;
			} else if (json.currently !== undefined && json.currently.temperature) {
				var temperature = json.currently.temperature;
			}

			var dictionary = {
				"Temperature" : temperature,
			}
		Pebble.sendAppMessage(dictionary,
	        function(e) {
	            console.log("Weather Data Sent to Pebble!");
	        },
	        function(e) {
	          console.log("Error sending weather info to Pebble!");
	        }
		);
	    }
	);
}

Pebble.addEventListener('ready', function() {

  // Update s_js_ready on watch
  Pebble.sendAppMessage({'AppKeyJSReady': 1});
  console.log("Ready received!");

});


Pebble.addEventListener('appmessage', function(e) {
    console.log("AppMessage received!");
    var dict = e.payload;


    if (dict['API_Key'] !== undefined) {
    	window.fio_key = dict["API_Key"];
    } else {
    	window.fio_key = false;
    }

    if (dict["Use_Imperial"] == 1) {
    	window.units = "us";
    } else if (dict["Use_Imperial"] == 0) {
    	window.units = "ca";
    } else {
    	window.units = "ca";
    }
    if (dict["SEND"] && dict["Use_GPS"] == 1) {
      navigator.geolocation.getCurrentPosition(
        setPos,
        noSetPos,
        {timeout: 6000, maximumAge: 60000, enableHighAccuracy: true}
      );
    } else if (dict["SEND"]) {
      if (dict["Lat"] || dict["Lon"]) {
        window.LAT = parseFloat(dict["Lat"]);
        window.LON = parseFloat(dict["Lon"]);
        console.log("Sending Fixed Location");
		  getWeather(window.units, window.fio_key);
      }
    }
});
