var get = function(selector) {
        return document.querySelector(selector);
    },
    getAll = function(selector) {
        return document.querySelectorAll(selector);
    },
    getStyle = function(selector, property) {
        return window.getComputedStyle(get(selector)).getPropertyValue(property);
    };

function tabSwitcher() {
    var tabs = getAll('.tabs label'),
        enterDuration = parseInt(getStyle('html', '--slide-in-duration').match(/\d+/)[0]),
        exitDuration = parseInt(getStyle('html', '--slide-out-duration').match(/\d+/)[0]);

    tabs.forEach(function(tab) {
        tab.addEventListener('click', clickBitch);
    });

    function clickBitch() {
        var nextIndex = this.dataset.index,
            currIndex = get('.tabs').style.getPropertyValue('--index'),
            nextVisible = getAll('.section-' + this.dataset.game),
            currVisible = getAll('.section-visible');

        if (currIndex === nextIndex) {
            return;
        } else if (currIndex > nextIndex) {
            hideAndSlide('left');
        } else {
            hideAndSlide('right');
        }

        function hideAndSlide(direction) {
            // fade out and hide old sections
            currVisible.forEach(function(section) {
                section.classList.add('slide-' + direction + '-fade-out');
                setTimeout(function() {
                    section.classList.remove('section-visible');
                    section.classList.remove('slide-' + direction + '-fade-out');
                }, exitDuration);
            });
            // fade in and show new sections
            nextVisible.forEach(function(section) {
                setTimeout(function() {
                    section.classList.add('section-visible');
                    section.classList.add('slide-' + direction + '-fade-in');
                }, exitDuration);
                setTimeout(function() {
                    section.classList.remove('slide-' + direction + '-fade-in');
                }, enterDuration + exitDuration);
            });
            get('.tabs').style.setProperty('--index', nextIndex);
        }
    }
}

tabSwitcher();