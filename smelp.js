var TESTING = true;


var ROOT_URL = "http://netflixrottenizer.appspot.com/yelp/";
if (TESTING) ROOT_URL = "http://localhost:11090/yelp";



$(function() {
    

    // ----------------------- MAIN RESTAURANT LIST ----------------------- //
    if($('#RestaurantResults').length) {

        var $vendorList = $('#VendorsTable');
        
        // Get the location by scraping the source code
        var search_zip = $('body').html().match("addressJs.preloadedZip \= '(.*)\'\;")[1];

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
                        $('.step2LocationRating').hide(); 
                        $('.rating-count').hide();
                    }
                })
            ;
        });
    }


    // ----------------------- RESTAURANT DETAIL PAGE ----------------------- //
    if($('#RestaurantPage').length) {
        var restaurant_name = $('#VendorName').text();
        var restaurant_zip = $('[itemprop="postalCode"]').text();
        var url = ROOT_URL + '?term=' + restaurant_name + '&location=' + restaurant_zip + '&limit=1'

        $.getJSON(url).
            success(function(data) {
                if(!data.error && data.businesses.length) {
                    console.log(data);
                    var smelp_rating = createSmelpRating(data.businesses[0])
                    $('#RatingBox').find('ul').append(smelp_rating);
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

