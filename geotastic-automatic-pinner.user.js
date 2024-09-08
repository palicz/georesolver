// ==UserScript==
// @name         Geotastic Automatic Pinner
// @namespace    PPV
// @version      1.6
// @description  At the beginning of each round, the script automatically places a marker on the map and simulates user interaction to trigger the "Finish Guess" button, allowing users to precisely finalize their guess location.
// @author       zenzty
// @match        https://geotastic.net/*
// @grant        none
// ==/UserScript==

(function () {
    let lat = 0;
    let long = 0;
    let map;
    let marker;
    let globalCoordinates = { lat: 0, lng: 0 };

    // Hijack XMLHttpRequest to intercept and process map metadata
    var originalXHR = window.XMLHttpRequest;
    var newXHR = function () {
        var xhr = new originalXHR();
        xhr.addEventListener('loadend', function () {
            if (xhr.responseURL == 'https://maps.googleapis.com/$rpc/google.internal.maps.mapsjs.v1.MapsJsInternalService/GetMetadata') {
                const respObj = JSON.parse(xhr.responseText);
                lat = respObj[1][0][5][0][1][0][2];
                long = respObj[1][0][5][0][1][0][3];
                globalCoordinates.lat = lat;
                globalCoordinates.lng = long;
                simulateMarkerPlacement();
            }
        });
        return xhr;
    };
    window.XMLHttpRequest = newXHR;

    function simulateMarkerPlacement() {
        if (marker) {
            marker.setMap(null);
        }
        map = window.myMap;

        // Place the marker
        marker = new google.maps.Marker({
            position: new google.maps.LatLng(globalCoordinates.lat, globalCoordinates.lng),
            map: map,
            title: 'Current Location',
            draggable: true
        });

        // Simulate a drag event (like moving the marker manually)
        google.maps.event.trigger(marker, 'dragstart', { latLng: marker.getPosition() });
        google.maps.event.trigger(marker, 'dragend', { latLng: marker.getPosition() });

        // Simulate a click event on the map to confirm placement
        google.maps.event.trigger(map, 'click', {
            latLng: marker.getPosition()
        });

        // Trigger any event listeners for guess completion
        setTimeout(() => {
            document.querySelector('.finish-guess-button').disabled = false; // Enable "Finish Guess"
        }, 500);
    }

    // Hijacking the google.maps.Map instance
    var checkInterval = setInterval(function () {
        if (typeof google === 'object' && typeof google.maps === 'object' && typeof google.maps.Map === 'function') {
            var originalMap = google.maps.Map;
            google.maps.Map = function () {
                var instance = new originalMap(...arguments);
                window.myMap = instance;
                return instance;
            }
            clearInterval(checkInterval);
        }
    }, 10);
})();
