// ==UserScript==
// @name         Geotastic Resolver
// @namespace    PPV
// @version      3.4
// @description  ----------------------------------------------------------------
// @author       zenzty
// @match		 https://geotastic.net/*
// @grant        none
// ==/UserScript==

(function () {
    let lat = 0;
    let long = 0;
    let coordInfo = '';

    // Script catches XMLHttpRequests (XHR) made by website.
        // Listens for XHR network events and checks if the response URL matches the given URL pattern: https://maps.googleapis.com/$rpc/google.internal.maps.mapsjs.v1.MapsJsInternalService/ GetMetadata%E2%80%9D
        // If a match is found, parse the JSON response and extract the latitude and longitude values.
        // These values are stored in the lat and long variables.
    var originalXHR = window.XMLHttpRequest;
    var newXHR = function () {
        var xhr = new originalXHR();
        xhr.addEventListener('loadend', function () {
            if (xhr.responseURL == 'https://maps.googleapis.com/$rpc/google.internal.maps.mapsjs.v1.MapsJsInternalService/GetMetadata') {
                const respObj = JSON.parse(xhr.responseText);
                lat = respObj[1][0][5][0][1][0][2];
                long = respObj[1][0][5][0][1][0][3];
            }
        });
        return xhr;
    };
    window.XMLHttpRequest = newXHR;

    // The script contains functions to get latitude and longitude coordinates
        // convert from decimal degrees (e.g. 40.7128, -74.0060) to degrees in a much more human, readable format. In minutes and seconds (DMS) with direction markers (e.g. 40°42'46.08"N, 74°0'21.60"W).

        // The conversion functions are:
            // convertCoords(lat, long): Converts latitude and longitude to DMS format.
            // convertToMinutes(decimal): Converts decimal degrees to minutes.
            // convertToSeconds(decimal): Converts decimal degrees to seconds.
            // getLatDirection(lat): Determines the north (N) or south (S) direction of the latitude.
            // getLongDirection(long): Determines the east (E) or west (W) direction of longitude.
    function convertCoords(lat, long) {
        var latResult, longResult, dmsResult;
        latResult = Math.abs(lat);
        longResult = Math.abs(long);
        dmsResult = Math.floor(latResult) + "°" + convertToMinutes(latResult % 1) + "'" + convertToSeconds(latResult % 1) + '"' + getLatDirection(lat);
        dmsResult += "+" + Math.floor(longResult) + "°" + convertToMinutes(longResult % 1) + "'" + convertToSeconds(longResult % 1) + '"' + getLongDirection(long);
        return dmsResult;
    }

    function convertToMinutes(decimal) {
        return Math.floor(decimal * 60);
    }

    function convertToSeconds(decimal) {
        return (decimal * 3600 % 60).toFixed(1);
    }

    function getLatDirection(lat) {
        return lat >= 0 ? "N" : "S";
    }

    function getLongDirection(long) {
        return long >= 0 ? "E" : "W";
    }

    // The script also contains a function called getCoordInfo().
        // This function uses the received latitude and longitude values to send a fetch request to a geocoding service (https://nominatim.openstreetmap.org/) to retrieve location information based on coordinates.
        // The location information is extracted from the response and sent back.
    async function getCoordInfo() {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${long}&format=json`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();

            const locationInfo = `
                Country: ${data.address.country}
                County: ${data.address.county}
                City: ${data.address.city}
                Road: ${data.address.road}
                State: ${data.address.state}
                Postcode: ${data.address.postcode}
                Village/Suburb: ${(data.address.village || data.address.suburb)}

                Postal Address: ${data.display_name}
            `;

            return locationInfo;
        } catch (error) {
            console.error('Error:', error);
            return 'Error retrieving location information';
        }
    }

    // Ctrl + Shift + Space: opens a new Google Maps URL with the converted coordinates.
    // Ctrl + Shift + Alt: Display as an alert with location information obtained from getCoordInfo().
    document.addEventListener('keydown', async function (event) {
        if (lat == 0 && long == 0) return;
        if (event.ctrlKey && event.shiftKey && event.code === 'Space') {
            window.open(`https://www.google.be/maps/search/${convertCoords(lat, long)}`);
        }
        if (event.ctrlKey && event.shiftKey && event.altKey) {
            alert(await getCoordInfo());
        }
    });
})();
