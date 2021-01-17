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
            const transform = `perspective(500px) scale(1.05) rotateX(${xRotate}deg) rotateY(${yRotate}deg)`;

            event.currentTarget.style.transform = transform;
            event.currentTarget.classList.add('card-hover');
        }

        // when viewport is < 500px the cards are full width and should not rotate
        // too lazy to use ResizeObserver
        if (document.body.clientWidth > 500) {
            cards.forEach(card => {
                card.addEventListener('mousemove', throttleMoveHandler(30), false);
                card.addEventListener('mouseout', function () {
                    card.removeAttribute('style');
                    card.classList.remove('card-hover');
                }, false);
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
            tab.addEventListener('click', changeTabs, false);
        });

        // make tabs keyboard accessible
        tabLists.forEach(tabList => {
            tabList.focus = 0;
            tabList.elements = getAll('.tab', tabList);
            tabList.addEventListener('keydown', keyHandler, false);
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

    // uses dygraphs library <http://dygraphs.com/>
    function initGraph() {
        let trafficData = 'https://raw.githubusercontent.com/Iiii-I-I-I/year-in-review-2020/master/data/traffic.csv',
            gridColor = '#efefef',
            lineColor = '#47a2d9',
            locale = 'default',
            dateOptions = {
                day: 'numeric',
                month: 'long'
            };

        // draw graph
        let graph = new Dygraph(get('.traffic-graph'), trafficData, {
                color: lineColor,
                strokeWidth: 3,
                axisLineColor: gridColor,
                gridLineColor: gridColor,
                gridLineWidth: 1,
                highlightCircleSize: 4,
                xRangePad: 4, // must match highlightCircleSize
                labelsDiv: get('.traffic-legend'),
                rollPeriod: 7,
                fillGraph: true,
                interactionModel: {
                    // allow user to drag finger across graph to see pageview numbers
                    'touchmove': function (event) {
                        let coords = event.touches[0];
                        let simulation = new MouseEvent('mousemove', {
                                clientX: coords.clientX,
                                clientY: coords.clientY
                            }
                        );

                        event.preventDefault();
                        event.target.dispatchEvent(simulation);
                    }
                },
                annotationMouseOverHandler: function (annotation) {
                    annotation.div.classList.remove('tooltip-hidden');
                    annotation.div.style.zIndex = '100'; // make sure tooltip appears on top of annotations
                },
                annotationMouseOutHandler: function (annotation) {
                    annotation.div.classList.add('tooltip-hidden');
                    annotation.div.style.removeProperty('z-index');
                },
                drawCallback: function (dygraph, isInitial) {
                    if (isInitial) {
                        dygraph.setAnnotations(annotations);

                        // create custom x-axis labels (default ones are misaligned)
                        for (let i = 0; i < 12; i++) {
                            let month = new Date(2020, i).toLocaleString(locale, { month: 'short' }),
                                labelNode = document.createElement('div'),
                                shortLabel = document.createElement('span'),
                                longLabel = document.createElement('span');

                            labelNode.classList.add('x-label');
                            shortLabel.classList.add('short-month');
                            shortLabel.textContent = month.substring(0, 1);
                            longLabel.classList.add('long-month');
                            longLabel.textContent = month;

                            labelNode.appendChild(shortLabel);
                            labelNode.appendChild(longLabel);
                            get('.traffic-x-labels').appendChild(labelNode);
                        }

                        // create custom y-axis labels (can't position default ones over top of graph)
                        let yAxisLabels = document.createElement('div');

                        yAxisLabels.classList.add('traffic-y-labels');
                        get('.traffic-graph').appendChild(yAxisLabels);

                        for (let i = 0; i <= 7; i++) {
                            let viewLabel = document.createElement('div');

                            viewLabel.classList.add('y-label');
                            viewLabel.textContent = i + ((i !== 0) ? 'M' : '');
                            yAxisLabels.appendChild(viewLabel);
                        }
                    }

                    tooltips.forEach((tooltip, i) => {
                        // insert tooltip inside its respective annotation
                        let annotation = get(`.annotation-${i + 1}`);

                        annotation.appendChild(tooltip);
                        annotation.removeAttribute('title');

                        // reposition tooltip if it goes offscreen
                        let tooltipRect = tooltip.getBoundingClientRect(),
                            leftPos = tooltipRect.left,
                            rightPos = document.body.clientWidth - tooltipRect.right,
                            margin = 16;

                        if (leftPos < 0) {
                            tooltip.style.left = -leftPos + margin + 'px';
                        } else if (rightPos < 0) {
                            tooltip.style.left = rightPos - margin + 'px';
                        }
                    });
                },
                legendFormatter: function (data) {
                    let date, actual, average, change;

                    if (data.x) {
                        date = new Date(data.xHTML).toLocaleString(locale, dateOptions);
                        actual = data.series[0].yHTML.actual; // currently unused
                        average = data.series[0].yHTML.average;
                        change = data.series[0].yHTML.change;
                    }

                    return `<div class="traffic-legend-date">${date}</div>
                            <div class="traffic-legend-actual">Pageviews: ${average}</div>
                            <div class="traffic-legend-rounded">14-day change: ${change}</div>`;
                },
                axes: {
                    x: {
                        drawAxis: false,
                        drawGrid: false
                    },
                    y: {
                        drawAxis: false,
                        includeZero: true,
                        valueRange: [null, 8000000],
                        valueFormatter: function (num, opts, series, graph, row, col) {
                            // original un-averaged value for this point
                            let currentValue = graph.getValue(row, col);

                            // 14-day change
                            let twoWeeksAgo = graph.getValue(row - 14, col);
                            let change = Math.round((currentValue - twoWeeksAgo) / twoWeeksAgo * 100);

                            if (change < 0) {
                                // replace default hyphen (VERY WRONG) with actual negative symbol
                                change = '−' + change.toString().substring(1);
                            } else {
                                // plus sign for positive numbers
                                change = '+' + change;
                            }

                            // 14-day change not possible for first 14 days
                            if (row < 14) change = '–';

                            return {
                                actual: currentValue.toLocaleString(locale),
                                average: Math.round(num).toLocaleString(locale), // auto-averaged over rollPeriod
                                change: change + '%'
                            };
                        }
                    }
                }
            }
        );

        // create annotations
        let annotations = [
                {
                    x: "2020/02/06",
                    text: "The Nightmare of Ashihama is released",
                    tickHeight: 15
                }, {
                    x: "2020/03/14",
                    text: "Traffic rises as COVID-19 lockdowns begin"
                }, {
                    x: "2020/05/01",
                    text: "Traffic drops as US states gradually reopen",
                    tickHeight: 15
                }, {
                    x: "2020/06/04",
                    text: "Sins of the Father is released"
                }, {
                    x: "2020/10/14",
                    text: "RuneScape is released on Steam"
                }, {
                    x: "2020/10/28",
                    text: "Trailblazer League begins",
                    tickHeight: 45
                }, {
                    x: "2020/12/25",
                    text: "Traffic dips around Christmas and holidays"
                }
            ],
            tooltips = [];

        annotations.forEach((annotation, i) => {
            annotation.series = 'Pageviews';
            annotation.shortText = i + 1;
            annotation.width = 24;
            annotation.height = 24;
            annotation.cssClass = `tooltip-hidden annotation-${i + 1}`;
            annotation.tickWidth = 2;
            if (annotation.tickHeight === undefined) annotation.tickHeight = 25;

            createTooltip(annotation.x, annotation.text);
        });

        function createTooltip(date, text) {
            let tooltip = document.createElement('div'),
                dateNode = document.createElement('div'),
                textNode = document.createElement('div');

            dateNode.classList.add('tooltip-date');
            dateNode.textContent = new Date(date).toLocaleString(locale, dateOptions);
            textNode.textContent = text;

            tooltip.classList.add('tooltip');
            tooltip.appendChild(dateNode);
            tooltip.appendChild(textNode);
            tooltips.push(tooltip);
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
        }, false);

        function buildQuiz() {
            let quiz = get('.quiz'),
                questions,
                total = 10,
                correct = 0,
                answered = 0;

            let buttonGroup = document.createElement('div');

            buttonGroup.classList.add('quiz-button-group');
            createButton('RuneScape', 'rs');
            createButton('Old School RuneScape', 'osrs');
            // createButton('The RuneScape<br />Classic quiz (fake)', 'rsc');
            quiz.appendChild(buttonGroup);

            function createButton(text, game) {
                let button = document.createElement('button');

                button.classList.add('quiz-start', 'button');
                button.textContent = text;
                button.addEventListener('click', function () {
                    get('.pick').style.display = 'none';
                    get('.quiz-button-group').remove();
                    setupQuestions(game);
                }, false);

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
                    // case 'rsc':
                    //     questions = request.response[0].rsc;
                    //     break;
                }

                // add class for css
                quiz.classList.add(game);

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
                    choices.forEach(choice => choice.addEventListener('click', checkAnswer, false));

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
                    quizGroup.addEventListener('keydown', keyHandler, false);

                    quizGroup.elements.forEach((choice, i) => {
                        // add tabindex="0" for first element, "-1" for the rest
                        choice.setAttribute('tabindex', (i === 0) ? 0 : -1);

                        // simulate click with enter key
                        choice.addEventListener('keydown', event => {
                            if (event.keyCode === 13) {
                                choice.click();
                                quizGroup.removeEventListener('keydown', keyHandler);
                            }
                        }, false);
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

                // @TODO: write nicer messages
                if (score >= 0.7) {
                    descNode.textContent = 'Very good. If you haven\'t already, you should sign up for our OSWF tasks and help us blahblah.';
                } else if (score > 0.3) {
                    descNode.textContent = 'it\'s okay i guess.';
                } else {
                    descNode.textContent = 'you fuckin idiot. consider reading the runescape wiki for once in your life.';
                }

                descNode.innerHTML += ' Would you like to try <span class="link reset-quiz" role="button">our other quiz</span>?';
                get('.reset-quiz').addEventListener('click', resetQuiz, false);

                function resetQuiz() {
                    quiz.textContent = '';
                    quiz.classList.remove(quiz.classList.item(1));

                    resultsNode.textContent = '';
                    resultsNode.removeAttribute('style');

                    get('.pick').style.display = 'block';
                    get('#quiz').scrollIntoView({behavior: 'smooth'});
                    buildQuiz();
                }
            }
        }
    }

    function initImage() {
        let thumb = get('.thumb');

        thumb.addEventListener('mouseover', preloadFullImage, { once: true });
        thumb.addEventListener('click', showModal, false);

        function preloadFullImage(event) {
            let preloader = document.createElement('link');

            preloader.href = event.currentTarget.dataset.src;
            preloader.rel = 'preload';
            preloader.as = 'image';

            document.head.appendChild(preloader);
        }

        function showModal(event) {
            let modal = document.createElement('div');
            let image = document.createElement('img');
            let note = document.createElement('div');

            modal.classList.add('modal');
            modal.appendChild(image);
            modal.appendChild(note);
            modal.addEventListener('click', closeModal, false);

            image.classList.add('image');
            image.src = event.currentTarget.dataset.src;

            note.classList.add('note');
            note.textContent = 'Click anywhere or press Esc to close.';

            document.addEventListener('keydown', escToClose, false);
            document.body.style.overflow = 'hidden';
            document.body.appendChild(modal);
        }

        function escToClose(event) {
            if (event.key === 'Escape') closeModal();
        }

        function closeModal() {
            get('.modal').remove();
            document.body.removeAttribute('style'); // unset overflow: hidden
        }
    }

    initPlants();
    initCards();
    initTabs();
    initGraph();
    initQuiz();
    initImage();
}());