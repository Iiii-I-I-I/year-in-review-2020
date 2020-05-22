function tabSwitcher() {
    var tabs = document.querySelectorAll('.tabs label');

    function clickBitch() {
        var game = this.dataset.game;
        var nextIndex = this.dataset.index;
        var currIndex = document.querySelector('.tabs').style.getPropertyValue('--index').trim();
        var nextVisible = document.querySelectorAll('.' + game);
        var currVisible = document.querySelectorAll('.section-visible');

        function hideAndSlide(direction, duration) {
            currVisible.forEach(function(section) {
                section.classList.add('slide-' + direction + '-fade-out');
                setTimeout(function() {
                    section.classList.remove('section-visible');
                    section.classList.remove('slide-' + direction + '-fade-out');
                }, duration);
            });
            nextVisible.forEach(function(section) {
                setTimeout(function() {
                    section.classList.add('section-visible');
                    section.classList.add('slide-' + direction + '-fade-in');
                }, duration);
                setTimeout(function() {
                    section.classList.remove('slide-' + direction + '-fade-in');
                }, duration * 2);
            });
            document.querySelector('.tabs').setAttribute('style', '--index: ' + nextIndex);
        }

        if (currIndex === nextIndex) {
            return;
        } else if (currIndex > nextIndex) {
            hideAndSlide('left', 200);
        } else {
            hideAndSlide('right', 200);
        }
    }

    tabs.forEach(function(tab) {
        tab.addEventListener('click', clickBitch);
    });
}

tabSwitcher();