var TESTING = false;
var ROOT_URL = "http://netflixrottenizer.appspot.com/yelp/";
if (TESTING) ROOT_URL = "http://localhost:11090/yelp";

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

                    var url = ROOT_URL + '?term=' + restaurant + '&location=' + search_zip + '&limit=1'
                    $.getJSON(url).
                        success(function(data) {
                            if(!data.error && data.businesses.length) {
                                var $smelp_rating = createSmelpRating(data.businesses[0])
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
        var url = ROOT_URL + '?term=' + restaurant_name + '&location=' + restaurant_zip + '&limit=1'

        $.getJSON(url).
            success(function(data) {
                if(!data.error && data.businesses.length) {
                    if($('#RestaurantPage').find('.smelp-rating').length === 0) {
                    var smelp_rating = createSmelpRating(data.businesses[0])
                    $('#PriceRange').before(smelp_rating);
                }
            })
        ;
    }
});

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

