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

    // based on <https://www.sitepoint.com/simple-javascript-quiz/>
    function startQuiz() {
        // @TODO: <https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/JSON>
        const myQuestions = [
            {
                question: "Who invented JavaScript?",
                answers: {
                    a: "Douglas Crockford",
                    b: "Sheryl Sandberg",
                    c: "Brendan Eich",
                    d: "Janet Reno"
                },
                correctAnswer: "c"
            },
            {
                question: "Which one of these is a JavaScript package manager?",
                answers: {
                    a: "Node.js",
                    b: "TypeScript",
                    c: "npm",
                    d: "Janet Reno"
                },
                correctAnswer: "c"
            },
            {
                question: "Which tool can you use to ensure code quality?",
                answers: {
                    a: "Angular",
                    b: "RequireJS",
                    c: "ESLint",
                    d: "Janet Reno"
                },
                correctAnswer: "d"
            },
            {
                question: "Who invented JavaScript?",
                answers: {
                    a: "Douglas Crockford",
                    b: "Sheryl Sandberg",
                    c: "Brendan Eich",
                    d: "Janet Reno"
                },
                correctAnswer: "c"
            },
        ];

        function buildQuiz() {
            let quiz = get('.quiz'),
                template = get('.template-group'),
                total = myQuestions.length,
                correct = 0,
                answered = 0;

            myQuestions.forEach((currentQ, i) => {
                let group = template.content.cloneNode(true),
                    number = group.querySelector('.quiz-number'),
                    question = group.querySelector('.quiz-question'),
                    choices = group.querySelectorAll('.quiz-choice');

                // fill in <template> with content
                number.textContent += ` ${i + 1}`;
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
                        this.classList.add('selected', 'incorrect');
                    }

                    // console.log(currentQ.answers, correctA);

                    answered += 1;
                    this.parentElement.classList.remove('unanswered');
                    groupChoices.forEach(choice => { choice.removeEventListener('click', validateChoice); });

                    if (answered === total) {
                        showResults();
                    }
                }
            });

            function showResults() {
                let results = get('.quiz-results');

                results.textContent = `You got ${correct} out of ${total} questions correct.`

                if (correct === total) {
                    results.textContent += ' congrats';
                } else if ((correct / total) >= 0.67) {
                    results.textContent += ' pretty good';
                } else if ((correct / total) >= 0.34) {
                    results.textContent += ' sit kid';
                } else {
                    results.textContent += ' pathetic';
                }
            }
        }

        buildQuiz();
    }

    gainPerspective();
    switchTabs();
    startQuiz();
})(), false);