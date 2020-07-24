document.addEventListener('DOMContentLoaded', (function() {
    'use strict';

    function get(selector, scope = document) {
        return scope.querySelector(selector);
    }

    function getAll(selector, scope = document) {
        return scope.querySelectorAll(selector);
    }

    // based on <https://technokami.in/3d-hover-effect-using-javascript-animations-css-html>
    function initCards() {
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
    function initGraph() {
        let gridColor,
            hairColor,
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
            lineColor = '#389dda';
            noteColor = '#196a9c';
        } else {
            gridColor = '#efefef';
            hairColor = '#e8e8e8';
            lineColor = '#50aee6';
            noteColor = '#318cc4';
        }

        let g = new Dygraph(get('.traffic-graph'), trafficData, {
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
                            let labels = getAll('.dygraph-axis-label-x'),
                                firstMonthLabel = labels[0].parentNode,
                                lastMonthLabel = labels[labels.length - 1].parentNode;

                            firstMonthLabel.style.left = '0';
                            lastMonthLabel.style.textAlign = 'center';
                        }
                    },
                    legendFormatter: function (data) {
                        let date = data.xHTML,
                            views = data.series[0].yHTML;

                        date = new Date(date).toLocaleString(undefined, dateOptions);
                        return `<div>${date}</div><div><b>Views: <span style="color: ${lineColor}">${views}</span></b></div>`;
                    },
                    axes: {
                        y: {
                            drawAxis: false,
                            valueRange: [null, 4750000],
                            valueFormatter: function (num, opts, series, dygraph, row, col) {
                                return Math.round(dygraph.getValue(row, col)).toLocaleString();
                            }
                        },
                        x: {
                            axisLineColor: 'transparent',
                            drawGrid: false,
                            pixelsPerLabel: 50,
                            axisLabelFormatter: function (date) {
                                return date.toLocaleString(undefined, {month: 'short'});
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

        let annotations = [
                {
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
                    text: "Traffic rises during the COVID-19 pandemic",
                    tickHeight: 25
                }, {
                    x: "2020/04/20",
                    text: "Just showing off tickHeight differences",
                    tickHeight: 15
                }, {
                    x: "2020/05/01",
                    text: "Traffic drops as US gradually reopens",
                    tickHeight: 30
                }, {
                    x: "2020/06/04",
                    text: "Sins of the Father is released"
                }
            ],
            tooltips = [];

        annotations.forEach((note, i) => {
            note.series = 'Pageviews';
            note.shortText = i + 1;
            note.width = 24;
            note.height = 24;
            note.cssClass = `tooltip-hidden annotation-${i + 1}`;
            if (note.tickHeight === undefined) note.tickHeight = 17;

            let tooltip = document.createElement('div'),
                tooltipDate = document.createElement('div'),
                tooltipText = document.createElement('div');

            tooltip.classList.add('tooltip', `tooltip-${i + 1}`);
            tooltip.style.background = noteColor;
            tooltip.appendChild(tooltipDate);
            tooltip.appendChild(tooltipText);

            tooltipDate.textContent = new Date(note.x).toLocaleString(undefined, dateOptions);
            tooltipText.textContent = note.text;
            tooltips.push(tooltip);
        });
    }

    function initTabs() {
        let tabGroups = getAll('.tabs'),
            tabs = getAll('.tabs label'),
            enterDuration = 275, // --anim-slow
            exitDuration = 150; // --anim-fast

        function clickBitch(event) {
            let nextIndex = event.currentTarget.dataset.index,
                currIndex = get('.tabs').style.getPropertyValue('--index'),
                nextRadio = getAll('.tab-' + event.currentTarget.dataset.game),
                nextVisible = getAll('.section-' + event.currentTarget.dataset.game),
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
    function initQuiz() {
        let request = new XMLHttpRequest(),
            requestURL = `https://raw.githubusercontent.com/Iiii-I-I-I/year-in-review${ /* CHEATERS BEGONE */'' }-2020/master/data/cryptic.json`;

        request.open('GET', requestURL);
        request.responseType = 'json';
        request.send();
        request.addEventListener('load', function () {
            buildQuiz();
        });

        function buildQuiz() {
            let quiz = get('.quiz'),
                buttonGroup = document.createElement('div'),
                total,
                questions,
                correct = 0,
                answered = 0;

            quiz.appendChild(buttonGroup);
            buttonGroup.classList.add('quiz-button-group');
            createButton('Take the<br />RuneScape quiz', 'rs');
            createButton('Take the Old School<br />RuneScape quiz', 'osrs');
            createButton('Take the RuneScape<br />Classic quiz (fake)', 'rsc');

            function createButton(buttonText, gameVersion) {
                let button = document.createElement('button');

                button.classList.add('quiz-start', 'button');
                button.innerHTML = buttonText;
                button.addEventListener('click', function () {
                    get('div', quiz).style.display = 'none';
                    get('.quiz-button-group').remove();
                    setupQuestions(gameVersion);
                });
                buttonGroup.appendChild(button);
            }

            function setupQuestions(gameVersion) {
                switch (gameVersion) {
                    case 'rs':
                        questions = request.response[0].rs;
                        break;
                    case 'osrs':
                        questions = request.response[0].osrs;
                        break;
                    case 'rsc':
                        quiz.textContent = 'no quiz for u';
                        return;
                    // pt-br? classic? idk
                }
                total = questions.length;
                questions.forEach((question, i) => {
                    let groupNode = get('.template-group').content.cloneNode(true),
                        numberNode = get('.quiz-number', groupNode),
                        questionNode = get('.quiz-question', groupNode),
                        explanationNode = get('.quiz-explanation', groupNode);

                    // fill in <template> with content
                    numberNode.textContent = `Question ${i + 1}`;
                    questionNode.textContent = question.question;
                    Object.keys(question.answers).forEach(answer => {
                        let choice = document.createElement('div');

                        choice.classList.add('quiz-choice');
                        choice.textContent = question.answers[answer];
                        get('.quiz-choice-group', groupNode).appendChild(choice);
                    });

                    let choiceNodes = getAll('.quiz-choice', groupNode);

                    choiceNodes.forEach(choice => choice.addEventListener('click', checkAnswer));
                    quiz.appendChild(groupNode);

                    function checkAnswer(event) {
                        let selectedAnswer = event.currentTarget.textContent,
                            correctAnswer = question.answers[question.correctAnswer];

                        if (selectedAnswer === correctAnswer) {
                            event.currentTarget.classList.add('selected', 'correct');
                            correct += 1;
                        } else {
                            let correctIndex = Object.keys(question.answers).indexOf(question.correctAnswer);

                            // reveal correct answer if wrong one is chosen
                            choiceNodes[correctIndex].classList.add('not-selected', 'correct');
                            event.currentTarget.classList.add('selected', 'incorrect');
                        }

                        // stop user from choosing again
                        choiceNodes.forEach(choice => choice.removeEventListener('click', checkAnswer));
                        if (question.explanation) explanationNode.textContent = question.explanation;

                        answered += 1;
                        event.currentTarget.parentElement.parentElement.classList.remove('unanswered');
                        if (answered === total) showResults();
                    }
                });
            }

            function showResults() {
                let resultsNode = get('.quiz-results'),
                    scoreNode = document.createElement('h3'),
                    descNode = document.createElement('p'),
                    resetNode = document.createElement('p'),
                    score = correct / total;

                resultsNode.style.display = 'block';
                resultsNode.appendChild(scoreNode);
                resultsNode.appendChild(descNode);
                resultsNode.appendChild(resetNode);

                // descNode.classList.add('results-description');
                // scoreNode.classList.add('results-number');
                scoreNode.textContent = `You answered ${correct} out of ${total} questions correctly.`;
                scoreNode.style.fontSize = '1.5em';
                descNode.style.marginBottom = '.5rem';

                if (score === 1) {
                    descNode.textContent = 'congrats! you should sign up for our OSWF tasks and help us blahblah.';
                } else if (score >= 0.75) {
                    descNode.textContent = 'pretty good. For more trivia questions like these, follow us on Twitter at @blahblahblah.';
                } else if (score >= 0.50) {
                    descNode.textContent = 'it\'s okay i guess. For more trivia questions like these, follow us on Twitter at @blahblahblah.';
                } else if (score >= 0.25) {
                    descNode.textContent = 'sit kid';
                } else if (0 > score < 0.25) {
                    descNode.textContent = 'you fucking donkey. you absolute turnip. you idiot sandwich';
                } else {
                    descNode.textContent = 'you fuckin idiot. consider reading the runescape wiki for once in your life';
                }

                resetNode.innerHTML = 'Would you like to try one of <span class="link reset-quiz" role="button">the other versions of the quiz</span>?';
                get('.reset-quiz').addEventListener('click', resetQuiz);

                function resetQuiz() {
                    get('div', quiz).style.display = 'block';
                    getAll('.quiz-group').forEach(group => {
                        group.remove();
                    });
                    resultsNode.textContent = '';
                    resultsNode.style.display = 'none';
                    buildQuiz();
                }
            }
        }
    }

    initCards();
    initGraph();
    initTabs();
    initQuiz();
})(), false);