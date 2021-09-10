/*section scroll*/

$(".click").click(function () {
    $('html,body').animate({
            scrollTop: $(".badges").offset().top
        },
        'slow');
});

/*youtube pause js*/
var videos = document.getElementsByTagName("iframe"),
    fraction = 0.8;

function checkScroll() {

    for (var i = 0; i < videos.length; i++) {
        var video = videos[i];

        var x = 0,
            y = 0,
            w = video.width,
            h = video.height,
            r, //right
            b, //bottom
            visibleX, visibleY, visible,
            parent;


        parent = video;
        while (parent && parent !== document.body) {
            x += parent.offsetLeft;
            y += parent.offsetTop;
            parent = parent.offsetParent;
        }

        r = x + parseInt(w);
        b = y + parseInt(h);


        visibleX = Math.max(0, Math.min(w, window.pageXOffset + window.innerWidth - x, r - window.pageXOffset));
        visibleY = Math.max(0, Math.min(h, window.pageYOffset + window.innerHeight - y, b - window.pageYOffset));


        visible = visibleX * visibleY / (w * h);


        if (visible > fraction) {
            playVideo();
        } else {
            pauseVideo();

        }
    }

};


var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
var player;


function onYouTubeIframeAPIReady() {
    player = new YT.Player('vid1', {
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
};

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
    window.addEventListener('scroll', checkScroll, false);
    window.addEventListener('resize', checkScroll, false);

    //check at least once so you don't have to wait for scrolling for the    video to start
    window.addEventListener('load', checkScroll, false);
};


function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING) {
        //console.log("event played");
    } else {
        //console.log("event paused");
    }
};

function stopVideo() {
    player.stopVideo();
};

function playVideo() {
    player.playVideo();
};

function pauseVideo() {
    player.pauseVideo();
};

/*youtube pause js*/

/*FAQ Dropdown animation*/

$(document).ready(function () {
    /* Mobile Menu */
    $("#menu-icon").click(function (){
    $(".mobile-menu").slideToggle();
    });

    /* Arrow rotate */
    $(".arrow").click(function () {
        $(".arrow").removeClass('rotate')
        $(this).toggleClass('rotate');
    });

    // site preloader -
    $(window).on("load", function (e) {
        $('#preloader').fadeOut('slow', function () {
            $(this).remove();
        });
    });

    $('.menu-container, .mobile-menu').on('click', '.logout', function() {
        var baseHost = Cookies.get('base_host');
        Cookies.remove('fl_token', { domain: baseHost });
        Cookies.remove('last_organization_location', { domain: baseHost });
        localStorage.removeItem('current_user');
        localStorage.removeItem('last_organization_location');
        $('.landing-links').show();
        $('.logged-in-links').hide();
    });

    var loggedIn = !!Cookies.get('fl_token');
    if (loggedIn){
      $('.landing-links').hide();
      $('.logged-in-links').show();
    }

});

/*carusal arrow custom class addition*/
$('.arrowlef').parent().addClass('leftnav');
$('.arrowrit').parent().addClass('rightnav');
$('.arrowlef2').parent().addClass('leftnav2');
$('.arrowrit2').parent().addClass('rightnav2');
$('.arrowlef3').parent().addClass('leftnav3');
$('.arrowrit3').parent().addClass('rightnav3');


//FAQ page 
$(function () {
    var Accordion = function (el, multiple) {
        this.el = el || {};
        this.multiple = multiple || false;

        // Variables privadas
        var links = this.el.find('.link');
        // Evento
        links.on('click', {
            el: this.el,
            multiple: this.multiple
        }, this.dropdown)
    }

    Accordion.prototype.dropdown = function (e) {
        var $el = e.data.el;
        $this = $(this),
            $next = $this.next();

        $next.slideToggle();
        $this.parent().toggleClass('open');

        if (!e.data.multiple) {
            $el.find('.submenu').not($next).slideUp().parent().removeClass('open');
        };
    }

    var accordion = new Accordion($('#accordion'), false);
});