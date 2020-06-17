var get = function(selector) {
        return document.querySelector(selector);
    },
    getAll = function(selector) {
        return document.querySelectorAll(selector);
    },
    getStyle = function(selector, property) {
        return window.getComputedStyle(get(selector)).getPropertyValue(property);
    };

// modified from <https://technokami.in/3d-hover-effect-using-javascript-animations-css-html>
// and <https://codeburst.io/throttling-and-debouncing-in-javascript-646d076d0a44>
function gainPerspective() {
    let cards = getAll('.wiki-card');

    cards.forEach(card => {
        const height = card.clientHeight,
              width = card.clientWidth;

        // throttle the rate at which moveHandler updates (delay is in milliseconds)
        function throttle(delay, fn) {
            let lastCall = 0;

            return function (...args) {
                const now = new Date().getTime();

                if (now - lastCall < delay) {
                    return;
                }

                lastCall = now;
                return fn(...args);
            }
        }

        function moveHandler(e) {
            // get position of mouse cursor within element
            let rect = e.currentTarget.getBoundingClientRect(),
                xVal = e.clientX - rect.left,
                yVal = e.clientY - rect.top;

            // calculate rotation value along the axes
            const multiplier = 15,
                  yRotation = multiplier * ((xVal - width / 2) / width),
                  xRotation = -multiplier * ((yVal - height / 2) / height);

            // generate string for CSS transform
            const transform = 'perspective(500px) rotateX(' + xRotation + 'deg) rotateY(' + yRotation + 'deg)';

            card.style.transform = transform;
            card.style.transition = 'transform .25s ease';
        }

        card.addEventListener('mousemove', throttle(50, moveHandler));
        card.addEventListener('mouseout', function() {
            card.removeAttribute('style');
        });
    });
}

function tabSwitcher() {
    let tabGroups = getAll('.tabs'),
        tabs = getAll('.tabs label'),
        enterDuration = parseInt(getStyle(':root', '--slide-slow').match(/\d+/)[0]),
        exitDuration = parseInt(getStyle(':root', '--slide-fast').match(/\d+/)[0]);

    tabs.forEach(tab => {
        tab.addEventListener('click', clickBitch);
    });

    function clickBitch() {
        let nextIndex = this.dataset.index,
            currIndex = get('.tabs').style.getPropertyValue('--index'),
            nextRadio = getAll('.tab-' + this.dataset.game),
            nextVisible = getAll('.section-' + this.dataset.game),
            currVisible = getAll('.section-visible');

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

            // update --index number for .tabs::before
            tabGroups.forEach(tabGroup => {
                tabGroup.style.setProperty('--index', nextIndex);
            });

            // update all radio inputs to match the one being clicked
            nextRadio.forEach(radio => {
                radio.checked = true;
            });

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

gainPerspective();
tabSwitcher();