var TESTING = false;
var ROOT_URL = "https://netflixrottenizer.appspot.com/";
if (TESTING) ROOT_URL = "http://localhost:9080/";

var new_stuff_added = false;

var cached_data = [];


chrome.storage.local.get('smelp_cache', function(data) {
    console.log(data.smelp_cache);
    if (data.smelp_cache) {
        cached_data = data.smelp_cache;
    }
});


$(function() {

    // ----------------------- MAIN RESTAURANT LIST ----------------------- //
    if($('.searchResults-items-container').length) {
        
        // Get the location by scraping the source code
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

    // Tab Handler
    $('#RestaurantPage').on('click', '#MenuPlusTabs a', function(e) {
        var $tips = $("#smelp-foursquare-tips");
        
        setTimeout(function() {
            var hash = window.location.hash

            if( hash === '#foursquare-tips' ) {
                $tips.show();
            }
            else if ( hash === '#photos-tab') {
                whenPhotosDoneLoading( addFoursquarePhotos );
            } 
            
            if (hash !== '#foursquare-tips') {
                $tips.hide();
            } 
            
        });
    });
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

function getYelpRatingsForList() {

    
    // var search_zip = $('body').html().match("addressJs.preloadedZip \= '(.*)\'\;")[1].trim();

    var search_zip = $('[name="places-autocomplete"]').val();


    var $vendorList = $('.searchResults-items-container');
    $vendorList.find('.searchResult').each(function() {
        
        var $this = $(this);
        if($this.hasClass('smelped')) return true;
        
        var business = null;
        var restaurant = $this.find('.restaurant-name').text().replace(/restaurant/gi, "").replace(/ *\([^)]*\) */g, "").replace(/[^\w\s]/gi, '').trim(); // get rid of special characters
        var vendorName = $this.find('.restaurantCard-search').attr('id').replace('ghs-search-results-restaurantId-', "");
        var $ratingCell = $this.find('.rating-container');
        $this.addClass('smelped');
        // See if we have it locally
        for (var i = 0; i < cached_data.length; i++) {
            if(cached_data[i].vendor_name === vendorName) {
                business = cached_data[i];
                break;
            }
        }

        // If we do, load cached data
        if(business) {
            var $smelp_rating = createSmelpRating(business);
            // Make sure it's not already there
            if($this.find('.smelp-rating').length === 0) {
                $ratingCell.prepend($smelp_rating).addClass('ratings-got-smelped');
                $smelp_rating.fadeIn();
            }
        } 
        
        // If we don't, hit the server
        else {
            var url = encodeURI(ROOT_URL + 'yelp?term=' + restaurant + '&location=' + search_zip + '&limit=3');
            $.getJSON(url).then(function(data) {

                console.log(data);


                if(!data.error && data.businesses.length) {

                    business = data.businesses[0];
                    business.vendor_name = vendorName;
                    
                    var add_it_to_cache = true;
                    for (var i = 0; i < cached_data.length; i++) {
                        if(cached_data[i].id !== business.id) continue;
                        else {
                            add_it_to_cache = false;
                            break;
                        }
                    }
                    if(add_it_to_cache) {
                        cached_data.push(business);
                        chrome.storage.local.set({smelp_cache: cached_data});
                    }
                    
                    var $smelp_rating = createSmelpRating(business);
                    // Make sure it's not already there
                    if($this.find('.smelp-rating').length === 0) {
                        $ratingCell.prepend($smelp_rating).addClass('ratings-got-smelped');
                        $smelp_rating.fadeIn();
                    }
                }
            });
        }
    });
    
    setTimeout(function() { getYelpRatingsForList() }, 1000);    
}


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
    if(photos && $('.smelp-photos').length === 0) {
        
        var $note = '<p class="smelp-note">Additional pictures added by Smelp, provided by Foursquare</p>'
        var $smelp_photos = $('<div class="smelp-photos"></div>');
        $smelp_photos.append($note);
        for (var i = 0; i < photos.length; i++) {
            var photo = photos[i];
            var $photo = '<a href="' + photo.url + '" target="_blank" class="smelp-photo thumb" style="background-image:url(\''+ photo.sizes.items[1].url + ' \')"></a>'
            $smelp_photos.append($photo)
        };
        
        $('.photos-tab').append($smelp_photos);
    }
}



function addFoursquareTips(tips) {
    
    // Add Tab
    $('#MenuPlusTabs').append(
        '<li><h2 class="tab-header">' +
            '<a href="#foursquare-tips" data-tab="#foursquare-tips-tab">User Tips <span class="count">' + tips.length + '</span></a>' +
        '</h2></li>');
    
    // Add Tip Content Wrapper
    var $tipsContainer = $('<div id="smelp-foursquare-tips" class="foursquare-tips-tab" style="display: none;"></div>');
    var $note = '<p class="smelp-note">Tips added by Smelp, provided by Foursquare</p>'

    $('#MenuPlusContent').append($tipsContainer);
    $tipsContainer.append($note);

    console.log(tips);
    if(tips) {
        for (var i = 0; i < tips.length; i++) {
            $tipsContainer.append( createSmelpTip( tips[i] ));
        };
    }
}

function createSmelpTip(tip) {
    var lastName = tip.user.lastName || '';
    return $('<a href="' + tip.canonicalUrl + '" target="_blank" class="foursquare-tip">' +
                '<img class="avatar" src="' + tip.user.photo + '" />' +
                '<div class="tip-info">' +
                    '<h4>' + tip.text + '</h4>' +
                    '<p>' + tip.user.firstName + ' ' + lastName + '<p/>' +
                '</div>' +
            '</a>'
            );
}


var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-47467597-1']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

