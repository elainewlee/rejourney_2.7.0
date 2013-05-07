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

        // Iterate over all of the recorded journey, populating the list on the history page.
        for(var i=0; i<qtyJourneys; i++){
            var j = results.rows.item(i);
            var el="<li><a href='#rejourney' class='journey_button' journey_id='" + j.id + "' data-ajax='false'>" + j.name + "</a></li>"
            $("#history_journeylist").append($(el));
            console.log('Appending qtyJourneys,' + el);
        }

        // Tell jQueryMobile to refresh the list
        $("#history_journeylist").listview('refresh');
        //     <div data-role="header">
        //         <h1>History</h1>
        //         <div data-role="navbar">
        //             <ul>

        //                 <li><a href="#home" data-transition="none" data-icon="home" data-inline="true">Home</a></li>
        //                 <li><a href="#history" data-transition="none" data-icon="info" data-inline="true">History</a></li>
        //                 <li><a href="#rejourney" data-transition="none" data-icon="star" data-inline="true">ReJourney!</a></li>
        //             </ul>
        //         </div><!--close navbar-->
        //     </div><!--close header-->
        console.log("listview('refresh')");
    }

    function errorCB(err) {
        console.log("Error processing SQL for journey_info?: " + err.message);
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
        getAllPhotos(selectedJourney);
        console.log("Clicked on journey_id: " + $(this).attr("journey_id"));
        //Now switch to rejourney page.
    });
});



// When the user views the Journey Info page
$('#journey_info').on('pageshow', function(){
    console.log("Showing the journey info for journey " + current_journey);
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

    /*
    // Calculate the total distance travelled
    total_km = 0;

    for(i = 0; i < journeyData.length; i++){

        if(i == (journeyData.length - 1)){
            break;
        }

        total_km += gps_distance(journeyData[i].coords.latitude, journeyData[i].coords.longitude, journeyData[i+1].coords.latitude, journeyData[i+1].coords.longitude);
    }

    total_km_rounded = total_km.toFixed(2);

    // Calculate the total time taken for the journey
    start_time = new Date(journeyData[0].timestamp).getTime();
    end_time = new Date(journeyData[journeyData.length-1].timestamp).getTime();

    total_time_ms = end_time - start_time;
    total_time_s = total_time_ms / 1000;

    final_time_m = Math.floor(total_time_s / 60);
    final_time_s = total_time_s - (final_time_m * 60);

    // Display total distance and time
    $("#journey_info_info").html('Travelled <strong>' + total_km_rounded + '</strong> km in <strong>' + final_time_m + 'm</strong> and <strong>' + final_time_s + 's</strong>');
    */
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
