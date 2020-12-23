(function () {
    'use strict';

    function get(selector, scope = document) {
        return scope.querySelector(selector);
    }

    function getAll(selector, scope = document) {
        return scope.querySelectorAll(selector);
    }

    // lets the reader use arrow keys to focus elements inside a target element,
    // requires the target element to have .focus and .elements properties
    // eg. parent.focus = 0;
    //     parent.elements = parent.querySelector('.elements-to-focus-on');
    //     parent.addEventListener('keydown', keyHandler);
    function keyHandler(event) {
        let target = event.currentTarget,
            elements = target.elements,
            key = event.key;

        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
            event.preventDefault(); // stop page from scrolling with arrow keys
            elements[target.focus].setAttribute('tabindex', -1);

            // move to next element
            if (['ArrowDown', 'ArrowRight'].includes(key)) {
                target.focus++;

                // if at the end, move to the start
                if (target.focus >= elements.length) {
                    target.focus = 0;
                }
            }
            // move to previous element
            else if (['ArrowUp', 'ArrowLeft'].includes(key)) {
                target.focus--;

                // if at the start, move to the end
                if (target.focus < 0) {
                    target.focus = elements.length - 1;
                }
            }

            elements[target.focus].setAttribute('tabindex', 0);
            elements[target.focus].focus();
        }
    }

    // don't care about storing this preference because users are not likely to return
    function initToogle() {
        let toogle = get('.toogle');

        toogle.addEventListener('click', function () {
            document.body.classList.toggle('theme-dark');
        });
    }

    // based on <https://technokami.in/3d-hover-effect-using-javascript-animations-css-html>
    function initCards() {
        let cards = getAll('.wiki-card');

        // throttle the rate at which moveHandler updates (delay is in milliseconds)
        function throttleMoveHandler(delay) {
            let time = Date.now();

            return function (event) {
                if ((time + delay - Date.now()) < 0) {
                    moveHandler(event);
                    time = Date.now();
                }
            };
        }

        function moveHandler(event) {
            // get position of mouse cursor within element
            let rect = event.currentTarget.getBoundingClientRect(),
                xPos = event.clientX - rect.left,
                yPos = event.clientY - rect.top;

            // calculate rotation value along the axes
            const multiplier = 15,
                  cardWidth = event.currentTarget.clientWidth,
                  cardHeight = event.currentTarget.clientHeight,
                  yRotate = multiplier * ((xPos - cardWidth / 2) / cardWidth),
                  xRotate = -multiplier * ((yPos - cardHeight / 2) / cardHeight);

            // generate string for transform and apply styles
            const transform = `perspective(750px) scale(1.05) rotateX(${xRotate}deg) rotateY(${yRotate}deg)`;

            event.currentTarget.style.transform = transform;
            event.currentTarget.classList.add('card-hover');
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

    // uses <https://github.com/wagerfield/parallax>, plant illustrations by Merds
    function initPlants() {
        if (!window.matchMedia('(prefers-reduced-motion)').matches) {
            let scenes = [get('.plants-top'), get('.plants-bottom')];

            for (let scene of scenes) {
                let plants = new Parallax(scene, {
                    hoverOnly: true,
                    originX: 0.45,
                    limitY: 0 // no vertical movement
                });
            }
        }
    }

    // based on <https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/Tab_Role>
    function initTabs() {
        let tabs = getAll('.tab'),
            tabLists = getAll('.tab-list');

        tabs.forEach(tab => {
            tab.addEventListener('click', changeTabs);
        });

        // make tabs keyboard accessible
        tabLists.forEach(tabList => {
            tabList.focus = 0;
            tabList.elements = getAll('.tab', tabList);
            tabList.addEventListener('keydown', keyHandler);
        });

        function changeTabs(event) {
            let parent = event.currentTarget.parentNode, // aka .tab-list
                currTab = get('.tab[aria-selected="true"]', parent),
                nextTab = event.currentTarget;

            let tabArray = Array.prototype.slice.call(getAll('.tab', parent)),
                currTabIndex = tabArray.indexOf(currTab),
                nextTabIndex = tabArray.indexOf(nextTab);

            if (currTabIndex === nextTabIndex) {
                return;
            } else if (currTabIndex > nextTabIndex) {
                hideAndSlide('left');
            } else {
                hideAndSlide('right');
            }

            function hideAndSlide(direction) {
                let currPanel = get('#' + currTab.getAttribute("aria-controls")),
                    nextPanel = get('#' + nextTab.getAttribute("aria-controls")),
                    enterDuration = 350, // --anim-slow
                    exitDuration = 125; // --anim-fast

                // deselect current tab, select clicked tab
                currTab.setAttribute('aria-selected', false);
                nextTab.setAttribute('aria-selected', true);

                // hide old panel, reveal new panel
                currPanel.classList.add('slide', `slide-${direction}-fade-out`);

                window.setTimeout(function () {
                    currPanel.setAttribute('hidden', '');
                    currPanel.classList.remove('slide', `slide-${direction}-fade-out`);
                    nextPanel.removeAttribute('hidden');
                    nextPanel.classList.add('slide', `slide-${direction}-fade-in`);
                }, exitDuration);

                window.setTimeout(function () {
                    nextPanel.classList.remove('slide', `slide-${direction}-fade-in`);
                }, enterDuration + exitDuration);

                // set --index for sliding background on .tab-list::before
                parent.style.setProperty('--index', nextTabIndex);
            }
        }
    }

    // uses dygraphs library <http://dygraphs.com/> and crosshair plugin
    function initGraph() {
        let graph,
            trafficData = 'https://raw.githubusercontent.com/Iiii-I-I-I/year-in-review-2020/master/data/traffic.csv',
            gridColor,
            hairColor,
            lineColor;

        setColors();
        drawGraph();

        function setColors() {
            // tooltip color is set in main.css
            if (document.body.classList.contains('theme-dark')) {
                gridColor = '#393939';
                hairColor = '#414141';
                lineColor = '#389dda';
            } else {
                gridColor = '#efefef';
                // hairColor = '#e8e8e8';
                // lineColor = '#50aee6';
                hairColor = '#e8e8e8';
                lineColor = '#91a0aa';
            }
        }

        function drawGraph() {
            let locale = 'default',
                dateOptions = {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                };

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
                        annotation.div.style.removeProperty('z-index');
                    },
                    drawCallback: function (dygraph, isInitial) {
                        if (isInitial) {
                            dygraph.setAnnotations(annotations);

                            // create my own x-axis month labels (default ones are misaligned)
                            for (let i = 0; i < 12; i++) {
                                let month = new Date(2020, i).toLocaleString(locale, { month: 'short' }),
                                    labelNode = document.createElement('div'),
                                    shortLabel = document.createElement('span'),
                                    longLabel = document.createElement('span');

                                labelNode.classList.add('month-label');
                                shortLabel.classList.add('short-month');
                                shortLabel.textContent = month.substring(0, 1);
                                longLabel.classList.add('long-month');
                                longLabel.textContent = month;

                                labelNode.appendChild(shortLabel);
                                labelNode.appendChild(longLabel);
                                get('.traffic-labels').appendChild(labelNode);
                            }
                        }

                        tooltips.forEach((tooltip, i) => {
                            let annotation = get(`.annotation-${i + 1}`),
                                tooltipRect = tooltip.getBoundingClientRect(),
                                leftPos = tooltipRect.left,
                                rightPos = document.body.clientWidth - tooltipRect.right,
                                margin = 10;

                            // insert tooltip inside its respective annotation
                            annotation.appendChild(tooltip);
                            annotation.removeAttribute('title');

                            // reposition tooltip if it goes offscreen
                            if (leftPos < 0) {
                                tooltip.style.left = -leftPos + margin + 'px';
                            } else if (rightPos < 0) {
                                tooltip.style.left = rightPos - margin + 'px';
                            }
                        });
                    },
                    legendFormatter: function (data) {
                        let date = data.xHTML,
                            views = data.series[0].yHTML;

                        date = new Date(date).toLocaleString(locale, dateOptions);
                        return `<div>${date}</div><div><b>Views: ${views}</b></div>`;
                    },
                    axes: {
                        y: {
                            drawAxis: false,
                            includeZero: true,
                            valueFormatter: function (num, opts, series, graph, row, col) {
                                // returns value that's been averaged over rollPeriod option above
                                return (Math.round(num / 1000) * 1000).toLocaleString(locale);

                                // returns original un-averaged value for this point
                                // return graph.getValue(row, col).toLocaleString();
                            }
                        },
                        x: {
                            drawAxis: false,
                            drawGrid: false
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

            // create annotations
            let annotations = [
                    {
                        x: "2020/02/06",
                        text: "The Nightmare of Ashihama is released"
                    }, {
                        x: "2020/03/14",
                        text: "Traffic rises as COVID-19 lockdowns begin",
                        tickHeight: 30
                    }, {
                        x: "2020/05/01",
                        text: "Traffic drops as US states gradually reopen"
                    }, {
                        x: "2020/06/04",
                        text: "Sins of the Father is released",
                        tickHeight: 25
                    }, {
                        x: "2020/07/16",
                        text: "Ferox Enclave is released"
                    }, {
                        x: "2020/10/14",
                        text: "RuneScape is released on Steam"
                    }, {
                        x: "2020/10/28",
                        text: "Trailblazer League begins",
                        tickHeight: 45
                    }
                ];
            let tooltips = [];

            annotations.forEach((annotation, i) => {
                annotation.series = 'Pageviews';
                annotation.shortText = i + 1;
                annotation.width = 24;
                annotation.height = 24;
                annotation.cssClass = `tooltip-hidden annotation-${i + 1}`;
                annotation.tickWidth = 2;
                if (annotation.tickHeight === undefined) annotation.tickHeight = 20;

                createTooltip(annotation.x, annotation.text);
            });

            function createTooltip(date, text) {
                let tooltip = document.createElement('div'),
                    dateNode = document.createElement('div'),
                    textNode = document.createElement('div');

                dateNode.textContent = new Date(date).toLocaleString(locale, dateOptions);
                textNode.textContent = text;

                tooltip.classList.add('tooltip');
                tooltip.appendChild(dateNode);
                tooltip.appendChild(textNode);
                tooltips.push(tooltip);
            }
        }

        // watch body element for class changes
        let themeObserver = new MutationObserver(switchThemes);
        themeObserver.observe(document.body, {attributes: true});

        // redraw graph with new colors when switching themes
        function switchThemes(target) {
            if (target[0].attributeName === 'class') {
                setColors();
                drawGraph();
            }
        }
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
                total,
                questions,
                correct = 0,
                answered = 0;

            let buttonGroup = document.createElement('div');

            buttonGroup.classList.add('quiz-button-group');
            createButton('The<br />RuneScape quiz', 'rs');
            createButton('The Old School<br />RuneScape quiz', 'osrs');
            createButton('The RuneScape<br />Classic quiz (fake)', 'rsc');
            quiz.appendChild(buttonGroup);

            function createButton(text, game) {
                let button = document.createElement('button');

                button.classList.add('quiz-start', 'button');
                button.innerHTML = text;
                button.addEventListener('click', function () {
                    get('.quiz-button-group').remove();
                    setupQuestions(game);
                });

                buttonGroup.appendChild(button);
            }

            function setupQuestions(game) {
                switch (game) {
                    case 'rs':
                        questions = request.response[0].rs;
                        break;
                    case 'osrs':
                        questions = request.response[0].osrs;
                        break;
                    case 'rsc':
                        quiz.textContent = 'no quiz for u';
                        return;
                }

                // @TODO:
                // pt-br version? classic version?
                // more possible question formats:
                //     listen to audio
                //     identify images

                total = questions.length;

                questions.forEach((question, i) => {
                    let groupNode = get('.template-group').content.cloneNode(true),
                        numberNode = get('.quiz-number', groupNode),
                        questionNode = get('.quiz-question', groupNode),
                        explanationNode = get('.quiz-explanation', groupNode),
                        answers = Object.keys(question.answers),
                        choices = [];

                    // fill in <template> with data
                    numberNode.textContent = `Question ${i + 1}`;
                    questionNode.textContent = question.question;
                    answers.forEach(answer => {
                        let choice = document.createElement('li');

                        choice.classList.add('quiz-choice');
                        choice.textContent = question.answers[answer];
                        choice.answerKey = answer;
                        choices.push(choice);
                        get('.quiz-choice-group', groupNode).appendChild(choice);
                    });

                    // insert completed question in DOM
                    quiz.appendChild(groupNode);

                    // validate choice
                    choices.forEach(choice => choice.addEventListener('click', checkAnswer));

                    function checkAnswer(event) {
                        let choice = event.currentTarget,
                            selectedKey = choice.answerKey,
                            correctKey = question.correctAnswer,
                            explanation = question.explanation;

                        if (selectedKey === correctKey) {
                            choice.classList.add('selected', 'correct');
                            correct++;
                        } else {
                            // reveal correct answer in addition to user's choice
                            let correct = choices.find(c => c.answerKey === correctKey);

                            correct.classList.add('not-selected', 'correct');
                            choice.classList.add('selected', 'incorrect');
                        }

                        // stop user from choosing again
                        choices.forEach(choice => choice.removeEventListener('click', checkAnswer));
                        choice.closest('.quiz-group').classList.remove('unanswered');

                        // stop keyHandler() focusing when input is not via keyboard
                        choice.blur();
                        choice.setAttribute('tabindex', -1);

                        // add explanation for correct answer
                        if (explanation) explanationNode.innerHTML = explanation;

                        answered++;
                        if (answered === total) showResults();
                    }
                });

                // make quiz keyboard accessible
                getAll('.quiz-group').forEach(quizGroup => {
                    quizGroup.focus = 0;
                    quizGroup.elements = getAll('.quiz-choice', quizGroup);
                    quizGroup.addEventListener('keydown', keyHandler);

                    quizGroup.elements.forEach((choice, i) => {
                        // add tabindex="0" for first element, "-1" for the rest
                        choice.setAttribute('tabindex', (i === 0) ? 0 : -1);

                        // simulate click with enter key
                        choice.addEventListener('keydown', event => {
                            if (event.keyCode === 13) {
                                choice.click();
                                quizGroup.removeEventListener('keydown', keyHandler);
                            }
                        });
                    });
                });
            }

            function showResults() {
                let resultsNode = get('.quiz-results'),
                    scoreNode = document.createElement('h3'),
                    descNode = document.createElement('p'),
                    score = correct / total;

                resultsNode.style.display = 'block';
                resultsNode.appendChild(scoreNode);
                resultsNode.appendChild(descNode);

                scoreNode.textContent = `You answered ${correct} out of ${total} questions correctly.`;
                scoreNode.style.fontSize = '1.25em';
                descNode.style.marginBottom = '0';

                if (score === 1) {
                    descNode.textContent = 'congrats! you should sign up for our OSWF tasks and help us blahblah.';
                } else if (score >= 0.75) {
                    descNode.textContent = 'pretty good. For more trivia questions like these, follow us on Twitter at @blahblahblah.';
                } else if (score >= 0.50) {
                    descNode.textContent = 'it\'s okay i guess. For more trivia questions like these, follow us on Twitter at @blahblahblah.';
                } else if (score >= 0.25) {
                    descNode.textContent = 'sit kid.';
                } else if (score > 0) {
                    descNode.textContent = 'you fucking donkey. you absolute turnip. you idiot sandwich.';
                } else {
                    descNode.textContent = 'you fuckin idiot. consider reading the runescape wiki for once in your life.';
                }

                descNode.innerHTML += ' Would you like to try one of <span class="link reset-quiz" role="button">the other quizzes</span>?';
                get('.reset-quiz').addEventListener('click', resetQuiz);

                function resetQuiz() {
                    quiz.textContent = '';
                    resultsNode.textContent = '';
                    resultsNode.removeAttribute('style');
                    get('#quiz').scrollIntoView({behavior: 'smooth'});
                    buildQuiz();
                }
            }
        }
    }

    // initToogle();
    initPlants();
    initCards();
    initTabs();
    initGraph();
    initQuiz();
}());