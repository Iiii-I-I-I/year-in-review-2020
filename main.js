var get = function(selector) {
        return document.querySelector(selector);
    },
    getAll = function(selector) {
        return document.querySelectorAll(selector);
    },
    getStyle = function(selector, property) {
        return window.getComputedStyle(get(selector)).getPropertyValue(property);
    };

function fadeInMain() {
    // don't animate <main> when < 50% of the header is visible; if user is scrolled
    // down and the page is reloaded, don't make them wait for the animation to finish

    var observer = new IntersectionObserver(entry => {
        if (entry[0].intersectionRatio > 0.5) {
            get('.container').classList.add('container-slide');
            observer.disconnect();
        }
    });

    observer.observe(get('header'));
}

function tabSwitcher() {
    var tabs = getAll('.tabs label'),
        enterDuration = parseInt(getStyle(':root', '--slide-slow').match(/\d+/)[0]),
        exitDuration = parseInt(getStyle(':root', '--slide-fast').match(/\d+/)[0]);

    tabs.forEach(tab => {
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
            currVisible.forEach(section => {
                section.classList.add('slide-' + direction + '-fade-out');
                setTimeout(() => {
                    section.classList.remove('section-visible');
                    section.classList.remove('slide-' + direction + '-fade-out');
                }, exitDuration);
            });
            // fade in and show new sections
            nextVisible.forEach(section => {
                setTimeout(() => {
                    section.classList.add('section-visible');
                    section.classList.add('slide-' + direction + '-fade-in');
                }, exitDuration);
                setTimeout(() => {
                    section.classList.remove('slide-' + direction + '-fade-in');
                }, enterDuration + exitDuration);
            });
            get('.tabs').style.setProperty('--index', nextIndex);
        }
    }
}

fadeInMain();
tabSwitcher();