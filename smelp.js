var TESTING = true;


var ROOT_URL = "http://netflixrottenizer.appspot.com/yelp/";
if (TESTING) ROOT_URL = "http://localhost:9080/yelp";

$(function() {
    var $vendorList = $('#VendorsTable');
    var user_address = $('title').text();
    user_address = user_address.slice(0, user_address.indexOf('Available'));

    console.log(user_address)

    var observer = new MutationObserver(function(mutation) {
        console.log(mutation);
    });
    observer.observe(document, { childList: true })

    
    $vendorList.on('DOMSubtreeModified', function(ok) {
        console.log(ok)
        console.log('stuff added');
    });
    
    $('#infscr-loading').attr('data-loading', 'false');

    console.log($('#infscr-loading'))
   
    $vendorList.find('tr').each(function() {
        var $this = $(this);
        var restaurant = $this.find('h3 .tooltip-header').text().replace(/[^\w\s]/gi, ''); // get rid of special characters
        
        var $ratingCell = $this.find('td:nth-child(4)')

        var url = ROOT_URL + '?term=' + restaurant + '&location=' + user_address + '&limit=1'
        $.getJSON(url).
            success(function(data) {
                if(!data.error && data.businesses.length) {
                    var restaurant = data.businesses[0];

                    var smelp_rating = $(
                            '<div class="smelp-rating">' +
                                '<a href="' + restaurant.url + '" target="_blank">' + 
                                    '<img src="' + chrome.extension.getURL('img/yelp-icon.png') + '" />' +
                                    restaurant.rating  + 
                                '</a>' +
                            '</div>'
                        );
                    $ratingCell.append(smelp_rating);    
                }
            })
        ;
    });
});

