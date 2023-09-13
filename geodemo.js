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

    // A szkript elkapja webhely által készített XMLHttpRequest-eket (XHR).
    // Figyeli az XHR network eseményeket, és ellenőrzi, hogy a válasz URL-je egyezik-e az adott URL mintával: https://maps.googleapis.com/$rpc/google.internal.maps.mapsjs.v1.MapsJsInternalService/GetMetadata%E2%80%9D
    // Ha talál egyezést, elemzi a JSON-választ, és kivonja a szélességi és hosszúsági értékeket.
    // Ezek az értékek a lat és long változókban tárolódnak.
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

    // A szkript olyan függvényeket tartalmaz, amelyek segítségével a szélességi és hosszúsági koordinátákat 
    // decimális fokokból (pl. 40,7128, -74,0060) sokkal emberibb, olvasható formátumú fokká konvertálja. Percben és másodpercben (DMS) irányjelzőkkel (pl. 40°42'46.08"N, 74°0'21.60"W).

    // Az átalakítási függvények a következők:
         // convertCoords(lat, long): A szélességi és hosszúsági fokokat DMS formátumba konvertálja.
         // convertToMinutes(decimal): A decimális fokokat percekké alakítja.
         // convertToSeconds(decimal): A decimális fokokat másodpercekké konvertálja.
         // getLatDirection(lat): Meghatározza a szélesség északi (É) vagy déli (D) irányát.
         // getLongDirection(long): A hosszúság keleti (K) vagy nyugati (Ny) irányát határozza meg.
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

    // A szkript tartalmaz egy getCoordInfo() nevű függvényt is.
    // Ez a funkció a kapott szélességi és hosszúsági értékeket arra használja, hogy lekérési kérelmet küldjön egy geokódoló szolgáltatásnak (https://nominatim.openstreetmap.org/), hogy a koordinátákon alapuló helyinformációkat kérjen le.
    // A helyinformációt a rendszer kivonja a válaszból, és viszaküldi.
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

     // Ctrl + Shift + Space: egy új Google Térkép URL-t nyit meg a konvertált koordinátákkal.
     // Ctrl + Shift + Alt: Alertként jelenít meg a getCoordInfo()-ból nyert helyinformációkkal.
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