function init() {
    function makeVisible(game, index) {
        var visibleSections = document.querySelectorAll('.' + game);

        document.querySelector('.tabs').setAttribute('style', '--index: ' + index);
        document.querySelector('#tab-' + game).checked = true;
        visibleSections.forEach(function(section) {
            section.classList.add('section-visible');
        });
    }

    if (!localStorage.getItem('yir-game')) {
        makeVisible('rs', '0');
    } else {
        var game = localStorage.getItem('yir-game');
        var index = localStorage.getItem('yir-index');

        makeVisible(game, index);
    }
}

function tabSwitcher() {
    var tabs = document.querySelectorAll('.tabs label');

    function clickBitch() {
        var game = this.dataset.game;
        var nextIndex = this.dataset.index;
        var currentIndex = localStorage.getItem('yir-index');
        var nextVisible = document.querySelectorAll('.' + game);
        var currentlyVisible = document.querySelectorAll('.section-visible');

        function hideAndSlide(direction, duration) {
            currentlyVisible.forEach(function(section) {
                section.classList.add('section-slide-' + direction + '-fade-out');
                setTimeout(function() {
                    section.classList.remove('section-visible');
                    section.classList.remove('section-slide-' + direction + '-fade-out');
                }, duration);
            });
            nextVisible.forEach(function(section) {
                setTimeout(function() {
                    section.classList.add('section-slide-' + direction + '-fade-in');
                    section.classList.add('section-visible');
                }, duration);
                setTimeout(function() {
                    section.classList.remove('section-slide-' + direction + '-fade-in');
                }, duration * 2);
            });
            document.querySelector('.tabs').setAttribute('style', '--index: ' + nextIndex);
            localStorage.setItem('yir-game', game);
            localStorage.setItem('yir-index', nextIndex);
        }

        if (currentIndex === nextIndex) {
            return;
        } else if (currentIndex > nextIndex) {
            hideAndSlide('left', 200);
        } else {
            hideAndSlide('right', 200);
        }
    }

    tabs.forEach(function(tab) {
        tab.addEventListener('click', clickBitch);
    });
}

init();
tabSwitcher();