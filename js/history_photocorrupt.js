
// When the user views the history page
$('#history').on('pageshow', function () {
    // alert('history page show');
    function querySuccess(tx, results) {
        console.log("Query success");
        var qtyJourneys = results.rows.length;
        // alert('results.rows.length' + results.rows.length);
        // alert('qtyJourneys' + qtyJourneys);
        $("#journeys_recorded").html("<strong>" + qtyJourneys + "</strong> journey(s) recorded.");

        console.log('history_journeylist= ' + history_journeylist);
        // Empty the list of recorded tracks
        $("#history_journeylist").empty();

        // Iterate over all of the recorded journeys, populating the list on the history page.
        for(var i=0; i<qtyJourneys; i++){
            var j = results.rows.item(i);
            var el="<li><a href='#rejourney' class='journey_button' journey_id='" + j.id + "' data-ajax='false'>" + j.name + "</a></li>"
            $("#history_journeylist").append($(el));
            console.log('Appending qtyJourneys,' + el);
        }

        // Tell jQueryMobile to refresh the list
        $("#history_journeylist").listview('refresh');
        console.log("journey listview('refresh')");
    }

    function errorCB(err) {
        console.log("Error processing SQL for journey_info: " + err.message);
    }

    db.transaction(function(tx) {
        // alert("transaction:" + tx);
        tx.executeSql('SELECT * FROM Journeys', [], querySuccess, errorCB);
    }, errorCB);
});

// When the user clicks a link to view journey info, set/change the photo_id attribute on the journey_info page.
$(document).ready(function() {
    $("#history_journeylist").on('click', "a.journey_button", function(){
        // $("#journey_info").attr("photo_id", $(this).text());
        selectedJourney = $(this).attr("journey_id");
        console.log("Clicked on journey_id: " + $(this).attr("journey_id"));
        //Now switch to rejourney page.
    });
});



// When the user views the Journey Info page
$('#journey_info').on('pageshow', function(){
    console.log("Showing the journey info for current_journey:  " + current_journey);
    // Find the photo_id of the journey they are viewing
    var key = $(this).attr("photo_id");


    /* Step 1: query for photos, tracks from db
       Step 2: Display on map */

    // Update the Journey Info page header to the journey_id
    $("#journey_info div[data-role=header] h1").text(key);

    // Get all the GPS data for the specific journey and photos
    var journeyData = window.localStorage.getItem(key);
    var photoData = window.localStorage.getItem(key);

    // Turn the stringified GPS journeyData and photoData back into a JS object
    journeyData = JSON.parse(journeyData);
    photoData = JSON.parse(journeyData);


    // -------------------------------Plotting the Journey and Photos on the Google Maps---------------------------------------------
    // Set the initial Lat and Long of the Google Map
    var myLatLng = new google.maps.LatLng(journeyData[0].coords.latitude, journeyData[0].coords.longitude);

    // Google Map options
    var myOptions = {
      zoom: 15,
      center: myLatLng,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    // Create the Google Map, set options
    var map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);

    var journeyCoords = [];
    var photoCoords = [];

    // Add each GPS entry to an array from the journey
    for(i=0; i<journeyData.length; i++){
        journeyCoords.push(new google.maps.LatLng(journeyData[i].coords.latitude, journeyData[i].coords.longitude));
    }

   // Add each GPS entry to an array from the photos taken on the photo
    for(i=0; i<photoData.length; i++){
        photoCoords.push(new google.maps.LatLng(photoData[i].coords.latitude, photoData[i].coords.longitude));
    }

    // Plot the GPS entries as a line on the Google Map
    var journeyPath = new google.maps.Polyline({
      path: journeyCoords,
      strokeColor: "#FF0000",
      strokeOpacity: 1.0,
      strokeWeight: 2
    });
    // Apply the line to the map
    journeyPath.setMap(map);

    // Plot the GPS entries from photos as a circles on the Google Map
    var photoMarkers = new google.maps.SymbolPath.CIRCLE({  //var photoMarkers = new google.maps.Marker({
      path: photoCoords,
      fillcolor: "gold",
      fillopacity: 1,
    });
    // Apply the journey line and photo markers to the map
    journeyPath.setMap(map);
    photoMarkers.setMap(map);

});



function gps_distance(lat1, lon1, lat2, lon2)
{
    // http://www.movable-type.co.uk/scripts/latlong.html
    var R = 6371; // km
    var dLat = (lat2-lat1) * (Math.PI / 180);
    var dLon = (lon2-lon1) * (Math.PI / 180);
    var lat1 = lat1 * (Math.PI / 180);
    var lat2 = lat2 * (Math.PI / 180);

    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c;

    return d;
}
//************************************* corrupt Behavior for Button "View Photos From This Journey"*********************************
// When the user clicks the viewPhotos button, set/change the journey_id attribute on the journey_info page.
// $(document).ready(function() {
//     $("#viewPhotos").on('click', "a.viewPhotosjourney_button", function(){
//         selectedJourneyURIs = $(this).attr("journey_id");
//         console.log("Clicked on journey_id: " + $(this).attr("journey_id"));
//         //Now switch to rejourney page.
//     });
// });


// When the user views the Journey Info page
$('#photoPage').on('pageshow', function () {
    console.log('photoPage page show');

    function photoPointQuerySuccess(tx, results) {
        var qtyPhotoPoints = results.rows.length;  //Will only return the photos points from the selected journey.
        console.log("photoQuerySuccess");
        // console.log('selectedJourneyURIs= ' + selectedJourneyURIs);
        // Empty the list of recorded tracks
        $("#photoDisplay").empty();

        // Iterate over all of the recorded photo points for the journey, populating the list on the history page.
        for(var i=0; i<qtyPhotoPoints; i++){
            var j = results.rows.item(i);
            var imgTag= '<img src="' + j.uri + '">'
            $("#photoDisplay").append($(imgTag));
            console.log('Appending qtyPhotoPoints:' + imgTag);
        }

        // Tell jQueryMobile to refresh the list
        $("#photoPage").listview('refresh');
        console.log("photoPage('refresh')");
    }

    function photoPointQueryError(err) {
        console.log("Error gettings photo URIs for selected journey: " + err.message);
    }

    db.transaction(function(tx) {
        // alert("transaction:" + tx);
        tx.executeSql('SELECT * FROM PhotoPoints WHERE journey_id = ?', [journey_id], photoPointQuerySuccess, photoPointQueryError);
    }
