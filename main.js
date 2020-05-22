function tabSwitcher() {
    var tabs = document.querySelectorAll('.tabs label');

    tabs.forEach(function(tab) {
        tab.addEventListener('click', clickBitch);
    });

    function clickBitch() {
        var nextIndex = this.dataset.index;
        var currIndex = document.querySelector('.tabs').style.getPropertyValue('--index');
        var nextVisible = document.querySelectorAll('.' + this.dataset.game);
        var currVisible = document.querySelectorAll('.section-visible');

        function hideAndSlide(direction, duration) {
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
            // must match --slide-duration in styles.css
            hideAndSlide('left', 200);
        } else {
            // must match --slide-duration in styles.css
            hideAndSlide('right', 200);
        }
    }
}

tabSwitcher();