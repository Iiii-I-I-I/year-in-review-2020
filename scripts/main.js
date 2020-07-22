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

    // uses dygraphs library <http://dygraphs.com/> and crosshair plugin
    function drawGraph() {
        let gridColor,
            lineColor,
            noteColor,
            trafficData = 'https://raw.githubusercontent.com/Iiii-I-I-I/year-in-review-2020/master/data/traffic.csv',
            dateOptions = {
                day: 'numeric',
                month: 'long'
            };

        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            gridColor = '#393939';
            hairColor = '#414141';
            lineColor = '#2985bd';
            noteColor = '#1d72a7';
        } else {
            gridColor = '#efefef';
            hairColor = '#e8e8e8';
            lineColor = '#50aee6';
            noteColor = '#318cc4';
        }

        let graph = new Dygraph(get('.traffic-graph'), trafficData, {
                    color: lineColor,
                    strokeWidth: 3,
                    axisLineColor: gridColor,
                    gridLineColor: gridColor,
                    gridLineWidth: 1,
                    highlightCircleSize: 5,
                    labelsDiv: get('.traffic-legend'),
                    rollPeriod: 7,
                    fillGraph: true,
                    interactionModel: {}, // disable range selector, pan/zoom, touch events
                    annotationMouseOverHandler: function (annotation) {
                        annotation.div.classList.remove('tooltip-hidden');
                        annotation.div.style.zIndex = '100'; // make sure tooltip appears on top of nearby annotations
                    },
                    annotationMouseOutHandler: function (annotation) {
                        annotation.div.classList.add('tooltip-hidden');
                        annotation.div.style.zIndex = '1';
                    },
                    drawCallback: function (dygraph, is_initial) {
                        if (is_initial) {
                            dygraph.setAnnotations(annotations);
                            tooltips.forEach((tooltip, i) => {
                                let annotation = get(`.annotation-${i + 1}`);

                                annotation.appendChild(tooltip);
                                annotation.removeAttribute('title');
                                annotation.style.backgroundColor = noteColor;
                            });

                            // minor visual fixes
                            let firstMonthLabel = get('.dygraph-roller').nextSibling,
                                lastMonthLabel = get('.annotation-1').previousSibling;

                            firstMonthLabel.style.left = '0';
                            lastMonthLabel.style.textAlign = 'center';
                        }
                    },
                    legendFormatter: function (data) {
                        let date = data.xHTML,
                            views = data.series[0].yHTML;

                        date = new Date(date).toLocaleString('en-GB', dateOptions);
                        return `<div>${date}</div><div><b>Views: <span style="color: ${noteColor}">${views}</span></b></div>`;
                    },
                    axes: {
                        y: {
                            drawAxis: false,
                            valueRange: [null, 4750000],
                            valueFormatter: function (views) {
                                return Math.round(views).toLocaleString();
                            }
                        },
                        x: {
                            axisLineColor: 'transparent',
                            drawGrid: false,
                            pixelsPerLabel: 50,
                            axisLabelFormatter: function (date) {
                                return date.toLocaleString('en-GB', {month: 'short'});
                            }
                        }
                    },
                    plugins: [
                        new Dygraph.Plugins.Crosshair({
                            direction: 'vertical',
                            crosshairColor: hairColor
                        })
                    ]
                }
            );

        let annotations = [{
                x: "2019/07/24",
                text: "Song of the Elves is released"
            }, {
                x: "2019/09/26",
                text: "The Fremennik Exiles is released"
            }, {
                x: "2019/11/14",
                text: "Twisted League is released",
                tickHeight: 20
            }, {
                x: "2020/02/06",
                text: "The Nightmare of Ashihama is released"
            }, {
                x: "2020/03/14",
                text: "Traffic begins to rise during pandemic",
                tickHeight: 24
            }, {
                x: "2020/04/20",
                text: "Just showing off tickHeight differences",
                tickHeight: 12
            }, {
                x: "2020/05/01",
                text: "Traffic drops as US gradually reopens",
                tickHeight: 25
            }, {
                x: "2020/06/04",
                text: "Sins of the Father is released"
            }],
            tooltips = [];

        annotations.forEach((note, i) => {
            note.series = 'Pageviews';
            note.shortText = i + 1;
            note.width = 24;
            note.height = 24;
            if (note.tickHeight === undefined) note.tickHeight = 17;
            note.cssClass = `tooltip-hidden annotation-${i + 1}`;

            let tooltip = document.createElement('div'),
                tooltipDate = document.createElement('div'),
                tooltipText = document.createElement('div');

            tooltip.classList.add('tooltip', `tooltip-${i + 1}`);
            tooltip.style.background = noteColor;
            tooltip.appendChild(tooltipDate);
            tooltip.appendChild(tooltipText);

            tooltipDate.textContent = new Date(note.x).toLocaleString('en-GB', dateOptions);
            tooltipText.textContent = note.text;
            tooltips.push(tooltip);
        });
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