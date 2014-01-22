var TESTING = true;


var ROOT_URL = "http://netflixrottenizer.appspot.com/yelp/";
if (TESTING) ROOT_URL = "http://localhost:11090/yelp";

// Get the location by scraping the source code
var search_zip = $('body').html().match("addressJs.preloadedZip \= '(.*)\'\;")[1];

$(function() {
    var $vendorList = $('#VendorsTable');
    var user_address = $('title').text();
    user_address = user_address.slice(0, user_address.indexOf('Available'));

    console.log(window.frames)

    $vendorList.on('DOMSubtreeModified', function(ok) {
        console.log('stuff added');
    });
    
    $vendorList.find('tr').each(function() {
        var $this = $(this);
        var restaurant = $this.find('h3 .tooltip-header').text().replace(/[^\w\s]/gi, ''); // get rid of special characters
        
        var $ratingCell = $this.find('td:nth-child(4)')

        var url = ROOT_URL + '?term=' + restaurant + '&location=' + search_zip + '&limit=1'
        $.getJSON(url).
            success(function(data) {
                if(!data.error && data.businesses.length) {
                    var smelp_rating = createSmelpRating(data.businesses[0])
                    $ratingCell.append(smelp_rating);    
                }
            })
        ;
    });
});

function createSmelpRating(restaurant) {
    return $('<div class="smelp-rating">' +
                '<a href="' + restaurant.url + '" target="_blank">' + 
                    '<img src="' + chrome.extension.getURL('img/yelp-icon.png') + '" />' +
                    restaurant.rating  + 
                '</a>' +
            '</div>'
        )
    ;
}

