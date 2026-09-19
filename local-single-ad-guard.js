(function () {
    function keepOneAd() {
        var ads = document.querySelectorAll('iframe[title="3rd party ad content"]');
        for (var index = 1; index < ads.length; index += 1) {
            ads[index].style.display = 'none';
        }
    }

    keepOneAd();
    new MutationObserver(keepOneAd).observe(document.documentElement, {
        childList: true,
        subtree: true
    });
})();
