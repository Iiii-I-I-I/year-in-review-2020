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
    // down and the page is reloaded, no point in making them wait for the animation
    // when they can't see the first three parts of it (the header) run

    var observer = new IntersectionObserver(entry => {
        if (entry[0].intersectionRatio > 0.5) {
            get('.container').classList.add('container-slide');
            observer.disconnect();
        }
    });

    observer.observe(get('header'));
}

// modified from <https://technokami.in/3d-hover-effect-using-javascript-animations-css-html>
function gainPerspective() {
    let cards = getAll('.wiki-card');

    cards.forEach(card => {
        const height = card.clientHeight;
        const width = card.clientWidth;

        function throttle(delay, fn) {
            let lastCall = 0;

            return function (...args) {
                const now = (new Date).getTime();

                if (now - lastCall < delay) {
                    return;
                }

                lastCall = now;
                return fn(...args);
            }
        }

        function moveHandler(e) {
            // get position of mouse cursor within element
            var rect = e.currentTarget.getBoundingClientRect();
            var xVal = e.clientX - rect.left;
            var yVal = e.clientY - rect.top;

            // calculate rotation value along the axes
            const multiplier = 15;
            const yRotation = multiplier * ((xVal - width / 2) / width);
            const xRotation = -multiplier * ((yVal - height / 2) / height);

            // generate string for CSS transform
            const transform = 'perspective(500px) rotateX(' + xRotation + 'deg) rotateY(' + yRotation + 'deg)';

            card.style.transform = transform;
            card.style.transition = 'transform .2s ease';
        }

        card.addEventListener('mousemove', throttle(50, moveHandler));
        card.addEventListener('mouseout', function() {
            card.removeAttribute('style');
        });
    });
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

// fadeInMain();
gainPerspective();
tabSwitcher();
