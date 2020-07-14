document.addEventListener('DOMContentLoaded', (function() {
    function get(selector) {
        return document.querySelector(selector);
    }

    function getAll(selector) {
        return document.querySelectorAll(selector);
    }

    // based on <https://technokami.in/3d-hover-effect-using-javascript-animations-css-html>
    function gainPerspective() {
        let cards = getAll('.wiki-card');

        // throttle the rate at which moveHandler updates (delay is in milliseconds)
        function throttleMoveHandler(delay) {
            var time = Date.now();

            return function (e) {
                if ((time + delay - Date.now()) < 0) {
                    moveHandler(e);
                    time = Date.now();
                }
            }
        }

        function moveHandler(e) {
            // get position of mouse cursor within element
            let rect = e.currentTarget.getBoundingClientRect(),
                xVal = e.clientX - rect.left,
                yVal = e.clientY - rect.top;

            // calculate rotation value along the axes
            const multiplier = 15,
                  cardWidth = e.currentTarget.clientWidth,
                  cardHeight = e.currentTarget.clientHeight,
                  yRotate = multiplier * ((xVal - cardWidth / 2) / cardWidth),
                  xRotate = -multiplier * ((yVal - cardHeight / 2) / cardHeight);

            // generate string for transform and apply styles
            const transform = `perspective(750px) scale(1.05) rotateX(${xRotate}deg) rotateY(${yRotate}deg)`;

            e.currentTarget.style.transform = transform;
            e.currentTarget.classList.add('card-hover');
        }

        // when viewport is < 500px the cards are full width and should not rotate
        // too lazy to use ResizeObserver
        if (document.body.clientWidth > 500) {
            cards.forEach(card => {
                card.addEventListener('mousemove', throttleMoveHandler(30));
                card.addEventListener('mouseout', () => {
                    card.removeAttribute('style');
                    card.classList.remove('card-hover');
                });
            });
        }
    }

    function switchTabs() {
        let tabGroups = getAll('.tabs'),
            tabs = getAll('.tabs label'),
            enterDuration = 275, // --anim-slow
            exitDuration = 150; // --anim-fast

        function clickBitch() {
            let nextIndex = this.dataset.index,
                currIndex = get('.tabs').style.getPropertyValue('--index'),
                nextRadio = getAll('.tab-' + this.dataset.game),
                nextVisible = getAll('.section-' + this.dataset.game),
                currVisible = getAll('.section-visible');

            // @TODO: animate via absolute positioning
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

        tabs.forEach(tab => {
            tab.addEventListener('click', clickBitch);
        });
    }

    // code based on <https://www.sitepoint.com/simple-javascript-quiz/>
    // design and ux stolen from NYT quizzes <https://www.nytimes.com/spotlight/news-quiz>
    function startQuiz() {
        let request = new XMLHttpRequest(),
            requestURL = 'https://raw.githubusercontent.com/Iiii-I-I-I/year-in-review-2020/master/questions.json', // CHEATERS BEGONE
            myQuestions;

        request.open('GET', requestURL);
        request.responseType = 'json';
        request.send();

        request.onload = function() {
            myQuestions = request.response;
            buildQuiz();
        }

        function buildQuiz() {
            let quiz = get('.quiz'),
                template = get('.template-group'),
                total = myQuestions.length,
                correct = 0,
                answered = 0;

            createStartButton();

            myQuestions.forEach((currentQ, i) => {
                let group = template.content.cloneNode(true),
                    number = group.querySelector('.quiz-number'),
                    question = group.querySelector('.quiz-question'),
                    choices = group.querySelectorAll('.quiz-choice');

                // fill in <template> with content
                number.textContent = `Question ${i + 1}`;
                question.textContent = currentQ.question;
                choices[0].textContent = currentQ.answers.a;
                choices[1].textContent = currentQ.answers.b;
                choices[2].textContent = currentQ.answers.c;
                choices[3].textContent = currentQ.answers.d;

                choices.forEach(choice => { choice.addEventListener('click', validateChoice); });
                quiz.appendChild(group);

                function validateChoice() {
                    let selectedA = this.textContent,
                        correctA = currentQ.answers[currentQ.correctAnswer],
                        groupChoices = this.parentElement.querySelectorAll('.quiz-choice');

                    if (selectedA === correctA) {
                        this.classList.add('selected', 'correct');
                        correct += 1;
                    } else {
                        let correctIndex = Object.keys(currentQ.answers).indexOf(currentQ.correctAnswer);

                        this.classList.add('selected', 'incorrect');
                        groupChoices[correctIndex].classList.add('not-selected', 'correct');
                    }

                    this.parentElement.classList.remove('unanswered');
                    groupChoices.forEach(choice => { choice.removeEventListener('click', validateChoice); });

                    answered += 1;
                    if (answered === total) {
                        showResults();
                    }
                }
            });

            function showResults() {
                let results = get('.quiz-results');

                results.style.display = 'block';
                results.textContent = `You got ${correct} out of ${total} questions correct. `

                if (correct === total) {
                    results.textContent += 'congrats ___ have you considered editing the wiki or OSWF';
                } else if ((correct / total) >= 0.75) {
                    results.textContent += 'pretty good';
                } else if ((correct / total) >= 0.50) {
                    results.textContent += 'okay';
                } else if ((correct / total) >= 0.25) {
                    results.textContent += 'sit kid';
                } else {
                    results.textContent += 'pathetic. consider reading the runescape wiki every once in a while';
                }

                results.textContent += ' For more trivia questions like these, follow us on Twitter at @blahblahblah.'
            }

            function createStartButton() {
                let button = document.createElement('button');

                button.classList.add('quiz-start');
                button.appendChild(document.createTextNode('Start quiz'));
                button.addEventListener('click', function () {
                    quiz.classList.remove('quiz-hidden');
                    button.remove();
                });
                get('.quiz').appendChild(button);
            }
        }
    }

    gainPerspective();
    switchTabs();
    startQuiz();
})(), false);