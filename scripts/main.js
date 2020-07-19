document.addEventListener('DOMContentLoaded', (function() {
    function get(selector, scope = document) {
        return scope.querySelector(selector);
    }

    function getAll(selector, scope = document) {
        return scope.querySelectorAll(selector);
    }

    // based on <https://technokami.in/3d-hover-effect-using-javascript-animations-css-html>
    function gainPerspective() {
        let cards = getAll('.wiki-card');

        // throttle the rate at which moveHandler updates (delay is in milliseconds)
        function throttleMoveHandler(delay) {
            let time = Date.now();

            return function (e) {
                if ((time + delay - Date.now()) < 0) {
                    moveHandler(e);
                    time = Date.now();
                }
            };
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
                card.addEventListener('mouseout', function () {
                    card.removeAttribute('style');
                    card.classList.remove('card-hover');
                });
            });
        }
    }

    function drawGraph() {
        let script = document.createElement('script'),
            csv = 'https://raw.githubusercontent.com/Iiii-I-I-I/year-in-review-2020/master/data/traffic.csv';

        document.body.appendChild(script);
        script.src = 'scripts/dygraph.min.js';
        script.addEventListener('load', function () {
            graphStuff();
        });

        function graphStuff() {
            let graphWidth = get('.traffic-graph').clientWidth,
                lineColor,
                gridColor,
                noteColor;

            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                gridColor = '#393939';
                lineColor = '#4ab1ef';
                noteColor = '#438ab5';
            } else {
                gridColor = '#ececec';
                lineColor = '#438ab5';
                noteColor = '#4ab1ef';
            }

            let graph = new Dygraph(get('.traffic-graph'), csv, {
                        title: 'Daily pageviews for all wikis',
                        titleHeight: 35,
                        width: graphWidth,
                        color: lineColor,
                        strokeWidth: 3,
                        axisLineColor: gridColor,
                        gridLineColor: gridColor,
                        gridLineWidth: 1,
                        highlightCircleSize: 4.5,
                        labelsSeparateLines: true,
                        xRangePad: 10, // padding on either ends of line
                        rollPeriod: 7, // rolling average
                        interactionModel: {}, // disable range selector, pan/zoom, touch events
                        legendFormatter: function (data) {
                            let date = data.xHTML,
                                views = data.series[0].yHTML,
                                options = {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                };

                            date = new Date(date).toLocaleString('en-GB', options);
                            return `${date}<br /><b>Pageviews: ${views}</b>`;
                        },
                        drawCallback: function (graph, is_initial) {
                            if (is_initial) graph.setAnnotations(annotations);
                        },
                        // underlayCallback: function(canvas, area, g) {
                        //     canvas.fillStyle = '#f9f9f9';
                        //     canvas.fillRect(area.x, area.y, area.w, area.h);
                        // },
                        axes: {
                            y: {
                                drawAxis: false,
                                valueFormatter: function (views) {
                                    return Math.round(views).toLocaleString();
                                }
                            },
                            x: {
                                axisLineColor: 'transparent',
                                drawGrid: false,
                                pixelsPerLabel: 50,
                                axisLineWidth: 1,
                                axisLabelFormatter: function (date) {
                                    return date.toLocaleString('en-GB', {month: 'short'});
                                }
                            }
                        }
                    }
                ),
                annotations = [{
                	x: "2019/07/24",
                	text: "Release of God Wars Dungeon"
                }, {
                	x: "2019/11/13",
                	text: "Release of Chef's Assistant"
                }, {
                	x: "2020/02/04",
                	text: "Partyhat duplication bug"
                }, {
                	x: "2020/03/14",
                	text: "Start of coronavirus pandemic"
                }, {
                	x: "2020/06/03",
                	text: "Twisted bow glitch"
                }];

            annotations.forEach((note, i) => {
                note.series = 'Pageviews';
                note.shortText = i + 1;
                note.width = 24;
                note.height = 24;
                note.tickHeight = 20;
                note.tickColor = noteColor;
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
                tabGroups.forEach(tabGroup => tabGroup.style.setProperty('--index', nextIndex));

                // update all radio inputs to match the one being clicked
                nextRadio.forEach(radio => radio.checked = true);
            }

            if (currIndex === nextIndex) {
                return;
            } else if (currIndex > nextIndex) {
                hideAndSlide('left');
            } else {
                hideAndSlide('right');
            }
        }

        tabs.forEach(tab => tab.addEventListener('click', clickBitch));
    }

    // design and ux stolen from NYT quizzes <https://www.nytimes.com/spotlight/news-quiz>
    function startQuiz() {
        let request = new XMLHttpRequest(),
            requestURL = `https://raw.githubusercontent.com/Iiii-I-I-I/year-in-review${ /* CHEATERS BEGONE */'' }-2020/master/data/cryptic.json`,
            myQuestions;

        request.open('GET', requestURL);
        request.responseType = 'json';
        request.send();
        request.addEventListener('load', function () {
            myQuestions = request.response;
            buildQuiz();
        });

        function buildQuiz() {
            let quiz = get('.quiz'),
                total = myQuestions.length,
                correct = 0,
                answered = 0;

            quiz.classList.add('quiz-hidden'); // limit height of quiz section before starting
            quiz.textContent = ''; // clear warning about quiz not working

            let buttonGroup = document.createElement('div');

            buttonGroup.classList.add('quiz-button-group');
            quiz.appendChild(buttonGroup);
            createStartButton('Take RS quiz');
            createStartButton('Take OSRS quiz');

            myQuestions.forEach((currQuestion, i) => {
                let group = get('.template-group').content.cloneNode(true),
                    number = get('.quiz-number', group),
                    question = get('.quiz-question', group),
                    explanation = get('.quiz-explanation', group);

                // fill in <template> with content
                number.textContent = `Question ${i + 1}`;
                question.textContent = currQuestion.question;
                Object.keys(currQuestion.answers).forEach(answer => {
                    let choice = document.createElement('div');

                    choice.classList.add('quiz-choice');
                    choice.textContent = currQuestion.answers[answer];
                    get('.quiz-choice-group', group).appendChild(choice);
                });

                let choiceGroup = getAll('.quiz-choice', group);

                choiceGroup.forEach(choice => choice.addEventListener('click', checkAnswer));
                quiz.appendChild(group);

                function checkAnswer() {
                    let selectedAnswer = this.textContent,
                        correctAnswer = currQuestion.answers[currQuestion.correctAnswer];

                    if (selectedAnswer === correctAnswer) {
                        this.classList.add('selected', 'correct');
                        correct += 1;
                    } else {
                        let correctIndex = Object.keys(currQuestion.answers).indexOf(currQuestion.correctAnswer);

                        // reveal correct answer if wrong one is chosen
                        choiceGroup[correctIndex].classList.add('not-selected', 'correct');
                        this.classList.add('selected', 'incorrect');
                    }

                    // stop user from choosing again
                    choiceGroup.forEach(choice => choice.removeEventListener('click', checkAnswer));
                    if (currQuestion.explanation) explanation.textContent = currQuestion.explanation;
                    this.parentElement.parentElement.classList.remove('unanswered');

                    answered += 1;
                    if (answered === total) showResults();
                }
            });

            function showResults() {
                let results = get('.quiz-results'),
                    numbers = document.createElement('div'),
                    desc = document.createElement('div'),
                    score = correct / total;

                results.style.display = 'block';
                results.appendChild(numbers);
                results.appendChild(desc);

                desc.classList.add('results-description');
                numbers.classList.add('results-number');
                numbers.textContent = `You answered ${correct} out of ${total} questions correctly.`;

                if (score === 1) {
                    desc.textContent = 'congrats! have you considered signing up for our OSWF tasks?';
                } else if (score >= 0.75) {
                    desc.textContent = 'pretty good. For more trivia questions like these, follow us on Twitter at @blahblahblah.';
                } else if (score >= 0.50) {
                    desc.textContent = 'it\'s okay i guess. For more trivia questions like these, follow us on Twitter at @blahblahblah.';
                } else if (score >= 0.25) {
                    desc.textContent = 'sit kid';
                } else if (score < 0.25 && score !== 0) {
                    desc.textContent = 'you fucking donkey. you absolute turnip. you idiot sandwich';
                } else {
                    desc.textContent = 'you fuckin idiot. consider reading the runescape wiki for once in your life';
                }
            }

            function createStartButton(text, game) {
                let button = document.createElement('button');

                button.classList.add('quiz-start', 'button');
                button.textContent = text;
                button.addEventListener('click', function () {
                    quiz.classList.remove('quiz-hidden');
                    get('.quiz-button-group').remove();
                    // load rs or osrs
                });
                buttonGroup.appendChild(button);
            }
        }
    }

    gainPerspective();
    drawGraph();
    switchTabs();
    startQuiz();
})(), false);