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
        var photos = [];
        var tips = [];

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
                        photos = venue.response.venue.photos.groups[1].items;
                        addFoursquareTips(venue.response.venue.tips.groups[0].items);
                            
                    })
                ;
            })
        ;
    }

    // Hack for the Tabs
    $('#RestaurantPage').on('click', '#MenuPlusTabs a', function() {
        var $tips = $("#smelp-foursquare-tips");
        
        // Let the page load a bit
        setTimeout(function() {
            var hash = window.location.hash

            if( hash === '#foursquare-tips' ) {
                $tips.show();
            }
            else if ( hash === '#photos-tab') {
                whenPhotosDoneLoading( addFoursquarePhotos );
            } 
            else if (hash !== '#foursquare-tips') {
                $tips.hide();
            } 
            
        }, 10)
        
    });




    function whenPhotosDoneLoading(callback) {
        if ($('#menuPlusImagesContent').children().length === 0) {
            setTimeout(function() { 
                whenPhotosDoneLoading(callback) 
            }, 1000)
            return false;
        } else {
            if (callback) callback(photos);
        }
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
    console.log('add em')
    if(photos && $('.smelp-photos').length === 0) {
        
        var $note = '<p class="smelp-note">Additional pictures added by Smelp, provide by Foursquare</p>'
        var $smelp_photos = $('<div class="smelp-photos"></div>');
        for (var i = 0; i < photos.length; i++) {
            var photo = photos[i];
            var $photo = '<a href="' + photo.url + '" target="_blank"><img class="thumb smelp-photo" src="' + photo.sizes.items[1].url + '"/></a>'
            $smelp_photos.append($photo)
        };
        $smelp_photos.append($note);

        $('.photos-tab').append($smelp_photos);    
    }
}



function addFoursquareTips(tips) {
    var $tipsContainer = '<div id="smelp-foursquare-tips" class="foursquare-tips-tab" style="display: none;">hahaha</div>';
    $('#MenuPlusContent').append($tipsContainer);
    $('#MenuPlusTabs').append(
        '<li><h2 class="tab-header">' +
            '<a href="#foursquare-tips" data-tab="#foursquare-tips-tab">User Tips</a>' +
        '</h2></li>');
    
    console.log(tips);
    if(tips) {
        for (var i = 0; i < tips.length; i++) {
            var tip = tips[i];
        };
    }
}

