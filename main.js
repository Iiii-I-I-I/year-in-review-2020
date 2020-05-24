var get = function(className) { return document.querySelector(className) },
    getAll = function(className) { return document.querySelectorAll(className) };

function tabSwitcher() {
    var tabs = getAll('.tabs label');

    tabs.forEach(function(tab) {
        tab.addEventListener('click', clickBitch);
    });

    function clickBitch() {
        var nextIndex = this.dataset.index,
            currIndex = get('.tabs').style.getPropertyValue('--index'),
            nextVisible = getAll('.section-' + this.dataset.game),
            currVisible = getAll('.section-visible'),
            duration = window.getComputedStyle(get('html')).getPropertyValue('--slide-duration').match(/\d+/)[0];

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
            get('.tabs').style.setProperty('--index', nextIndex);
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