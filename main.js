function tabSwitcher() {
    var tabs = document.querySelectorAll('.tabs label');

    tabs.forEach(function(tab) {
        tab.addEventListener('click', clickBitch);
    });

    function clickBitch() {
        var duration = window.getComputedStyle(document.querySelector('html')).getPropertyValue('--slide-duration').match(/\d+/)[0];
        var nextIndex = this.dataset.index;
        var currIndex = document.querySelector('.tabs').style.getPropertyValue('--index');
        var nextVisible = document.querySelectorAll('.section-' + this.dataset.game);
        var currVisible = document.querySelectorAll('.section-visible');

        function hideAndSlide(direction) {
            // fade out and hide old sections
            currVisible.forEach(function(section) {
                section.classList.add('slide-' + direction + '-fade-out');
                setTimeout(function() {
                    section.classList.remove('section-visible');
                    section.classList.remove('slide-' + direction + '-fade-out');
                }, duration);
            });
            // fade in and show new sections
            nextVisible.forEach(function(section) {
                setTimeout(function() {
                    section.classList.add('section-visible');
                    section.classList.add('slide-' + direction + '-fade-in');
                }, duration);
                setTimeout(function() {
                    section.classList.remove('slide-' + direction + '-fade-in');
                }, duration * 2);
            });
            document.querySelector('.tabs').style.setProperty('--index', nextIndex);
        }

        if (currIndex === nextIndex) {
            return;
        } else if (currIndex > nextIndex) {
            hideAndSlide('left');
        } else {
            hideAndSlide('right');
        }
    }
}

tabSwitcher();