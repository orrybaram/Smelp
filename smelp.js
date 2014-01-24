var TESTING = 1;
var ROOT_URL = "http://netflixrottenizer.appspot.com/";
if (TESTING) ROOT_URL = "http://localhost:9080/";

var new_stuff_added = false;

$(function() {
    
    // ----------------------- MAIN RESTAURANT LIST ----------------------- //
    if($('#RestaurantResults').length) {
        
        // Get the location by scraping the source code
        var search_zip = $('body').html().match("addressJs.preloadedZip \= '(.*)\'\;")[1];

        function getYelpRatingsForList() {
            var $vendorList = $('#VendorsTable');
            $vendorList.find('tr').each(function() {
                var $this = $(this);
                if(!$this.hasClass('smelped')) {
                    var restaurant = $this.find('h3 .tooltip-header').text().replace(/[^\w\s]/gi, ''); // get rid of special characters
                
                    var $ratingCell = $this.find('td:nth-child(4)')

                    var url = ROOT_URL + 'yelp?term=' + restaurant + '&location=' + search_zip + '&limit=1'
                    $.getJSON(url).
                        success(function(data) {
                            if(!data.error && data.businesses.length) {
                                var $smelp_rating = createSmelpRating(data.businesses[0])
                                
                                // Make sure it's not already there
                                if($this.find('.smelp-rating').length === 0) {
                                    $ratingCell.prepend($smelp_rating).addClass('ratings-got-smelped');
                                    $smelp_rating.fadeIn();
                                }
                            }
                            $this.addClass('smelped');
                        })
                    ;
                }
            });
            setTimeout(function() { getYelpRatingsForList() }, 1000);    
        }
        getYelpRatingsForList();
    }


    // ----------------------- RESTAURANT DETAIL PAGE ----------------------- //
    
    if($('#RestaurantPage').length) {

        var restaurant_name = $('#VendorName').text();
        var restaurant_zip = $('[itemprop="postalCode"]').text();
        var url = ROOT_URL + 'yelp?term=' + restaurant_name + '&location=' + restaurant_zip + '&limit=1';
        $.getJSON(url).
            success(function(data) {
                if(!data.error && data.businesses.length) {
                    var smelp_rating = createSmelpRating(data.businesses[0]);
                    $('#PriceRange').before(smelp_rating);
                }
            })
        ;

        // Foursquare Info
        // first we search for the venue by restaurant name and zip
        $.get(ROOT_URL + 'foursquare/search?query=' + restaurant_name + '&near=' + restaurant_zip + '&limit=1').
            
            // If that succeeds we take the returned venue id and get all of the venue data
            then(function(data) {
                $.getJSON(ROOT_URL + 'foursquare/venue?' + data).
                    success(function(venue) {
                        console.log(venue)
                        addFoursquarePhotos(venue.response.venue.photos.groups[1].items)
                    })
                ;
            })
        ;
    }
});

// Template for the Rating
function createSmelpRating(restaurant) {
    return $('<div class="smelp-rating">' +
                '<a title="View on Yelp.com" href="' + restaurant.url + '" target="_blank">' + 
                    '<img class="yelp_icon" src="' + chrome.extension.getURL('img/yelp-icon.png') + '" />' +
                    '<img class="smelp_rating_img" src="'+ restaurant.rating_img_url + '" />'  +
                    '<span>' + restaurant.review_count + ' reviews</span>' +
                '</a>' +
            '</div>'
        )
    ;
}

function addFoursquarePhotos(photos) {
    console.log(photos)
    var $note = '<p class="smelp-note">Additional pictures added by Smelp, provide by Foursquare</p>'
    for (var i = 0; i < photos.length; i++) {
        var photo = photos[i];

        var $photo = '<a href="' + photo.url + '" target="_blank"><img class="thumb smelp-photo" src="' + photo.sizes.items[1].url + '"/></a>'


        $('.photos-tab #menuPlusImagesContent')
            .append($photo)
    };
    $('.photos-tab').append($note)

}

