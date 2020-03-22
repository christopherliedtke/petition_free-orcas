(function() {
    var hamburger = $('#hamburger');
    var nav = $('nav');

    hamburger.click(function() {
        nav.toggleClass('show');
    });
})();
