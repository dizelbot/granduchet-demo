/* ========================================
   Квиз «Оценка уровня цифровизации бизнеса»
   granduchet.ru
   JavaScript v1.0
   ======================================== */

(function () {
    'use strict';

    /* ============================================
       ДАННЫЕ: 19 вопросов, 4 блока
       ============================================ */
    const QUIZ_DATA = [
        {
            id: 1,
            title: 'Автоматизация финансового и бухгалтерского учета',
            questions: [
                {
                    id: 'q1',
                    text: 'Как осуществляется загрузка банковских выписок?',
                    options: [
                        'Автоматически через интеграцию с банком',
                        'Загружаются вручную',
                        'Вводятся вручную бухгалтером'
                    ]
                },
                {
                    id: 'q2',
                    text: 'Как формируются счета и закрывающие документы?',
                    options: [
                        'Автоматически согласно графику',
                        'Создаем каждый документ отдельно',
                        'Создаем в Word/Excel'
                    ]
                },
                {
                    id: 'q3',
                    text: 'Используется ли ЭДО с контрагентами?',
                    options: ['Да', 'Только получаем', 'Нет']
                },
                {
                    id: 'q4',
                    text: 'Есть ли распознавание первички?',
                    options: ['Автоматически в 1С', 'Вручную из PDF/бумаги', 'Нет, теряются']
                },
                {
                    id: 'q5',
                    text: 'Ведете ли управленческий учет?',
                    options: [
                        'Да, на основе бухгалтерского',
                        'Да, во внешних файлах вручную',
                        'Нет'
                    ]
                }
            ]
        },
        {
            id: 2,
            title: 'Документооборот и цифровые документы',
            questions: [
                {
                    id: 'q6',
                    text: 'Как вы организуете архив бухгалтерских документов?',
                    options: ['Не больше 5 минут', 'Несколько часов', 'Несколько дней']
                },
                {
                    id: 'q7',
                    text: 'Сколько занимает подписание документов?',
                    options: ['До 1 дня', '2-5 дней', 'Более недели']
                },
                {
                    id: 'q8',
                    text: 'Как организовано согласование?',
                    options: [
                        'Электронно в системе',
                        'Виза на бумаге/e-mail',
                        'Процесс не организован'
                    ]
                },
                {
                    id: 'q9',
                    text: 'Есть ли контроль сроков согласования?',
                    options: ['Да', 'Частично', 'Нет']
                }
            ]
        },
        {
            id: 3,
            title: 'Кадровые процессы и цифровое трудоустройство',
            questions: [
                {
                    id: 'q10',
                    text: 'Как происходит оформление сотрудников?',
                    options: ['Онлайн (КЭДО)', 'Онлайн-документы, подпись в офисе', 'Лично в офисе']
                },
                {
                    id: 'q11',
                    text: 'Как подписывают кадровые документы?',
                    options: ['Электронно (КЭДО)', 'Смешанно', 'Все на бумаге']
                },
                {
                    id: 'q12',
                    text: 'Время оформления нового сотрудника?',
                    options: ['До 1 часа', 'До 4 часов', 'Несколько дней']
                }
            ]
        },
        {
            id: 4,
            title: 'Роботизация и цифровые сервисы',
            questions: [
                {
                    id: 'q13',
                    text: 'Используются ли RPA роботы?',
                    options: ['Да', 'Пилотный уровень', 'Нет']
                },
                {
                    id: 'q14',
                    text: 'Обработка входящих писем и документов?',
                    options: ['Да, автоматическая', 'Частично', 'Нет']
                },
                {
                    id: 'q15',
                    text: 'Интеграции между ключевыми системами?',
                    options: ['Полная интеграция', 'Частично', 'Нет интеграции']
                },
                {
                    id: 'q16',
                    text: 'Автоматическое формирование отчетов?',
                    options: ['Да', 'Частично', 'Нет']
                },
                {
                    id: 'q17',
                    text: 'Используются ли дашборды?',
                    options: ['Да', 'Запланировано', 'Нет']
                },
                {
                    id: 'q18',
                    text: 'Автоматические уведомления о проблемах?',
                    options: ['Да', 'Частично', 'Нет']
                },
                {
                    id: 'q19',
                    text: 'Доля автоматических операций?',
                    options: ['Более 50%', '20-50%', 'Менее 20%']
                }
            ]
        }
    ];

    /* ============================================
       SEO-ПОДСКАЗКИ (инфо-баннеры)
       ============================================ */
    const BANNER_TEXTS = {
        1: 'Роботизация разноски выписок экономит до 40% времени бухгалтера и исключает ошибки в назначении платежа.',
        2: 'Внедрение электронного документооборота сокращает расходы на курьеров и архивы, а также ускоряет сверку взаиморасчетов.',
        3: 'Переход на КЭДО сокращает время оформления сотрудника с нескольких дней до одного часа и исключает бумажную волокиту.',
        4: 'Роботизация (RPA) позволяет автоматизировать до 70% рутинных операций, освобождая время сотрудников для стратегических задач.'
    };

    /* ============================================
       СОСТОЯНИЕ
       ============================================ */
    const state = {
        currentBlock: 0,        // 0-indexed
        currentQInBlock: [0, 0, 0, 0], // текущий вопрос в каждом блоке
        answers: {},            // { qId: optionIndex }
        bannerShown: {},        // { blockId: true } — не показываем повторно при возврате
        isSubmitting: false,
        initialized: false
    };

    /* ============================================
       DOM ССЫЛКИ
       ============================================ */
    let els = {};

    function cacheDom() {
        els.quiz = document.querySelector('.granduchet-quiz');
        els.landing = document.querySelector('.quiz-landing');
        els.startBtn = document.querySelector('.quiz-btn-start');

        els.screens = document.querySelectorAll('.quiz-screen');
        els.nav = document.querySelector('.quiz-navigation');
        els.backBtn = document.querySelector('.quiz-nav-back');
        els.nextBtn = document.querySelector('.quiz-nav-next');
        els.nextBtnText = els.nextBtn ? els.nextBtn.querySelector('.quiz-nav-next-text') : null;
        els.finalScreen = document.querySelector('.quiz-final-screen');
        els.thankyou = document.querySelector('.quiz-thankyou');
        els.blockContainers = document.querySelectorAll('.quiz-block-container');
        els.form = document.querySelector('.quiz-final-form');
        els.formName = document.getElementById('quiz-name');
        els.formCompany = document.getElementById('quiz-company');
        els.formEmail = document.getElementById('quiz-email');
        els.formPhone = document.getElementById('quiz-phone');
        els.formConsent = document.getElementById('quiz-consent');
        els.formPolicy = document.getElementById('quiz-policy');
        els.formErrors = document.querySelectorAll('.quiz-form-error');
        els.submitReport = document.getElementById('quiz-submit-report');
        els.submitConsult = document.getElementById('quiz-submit-consult');
        els.swipeHint = document.querySelector('.quiz-swipe-hint');
    }

    /* ============================================
       РЕНДЕРИНГ ВОПРОСОВ
       ============================================ */
    function renderQuestions() {
        els.blockContainers.forEach(function (container, index) {
            var block = QUIZ_DATA[index];
            if (!block) return;

            var html = '';
            html += '<div class="quiz-block-header">';
            html += '  <div class="quiz-block-number">Вопрос <span class="quiz-q-counter">1</span> из ' + block.questions.length + '</div>';
            html += '  <h2 class="quiz-block-title">' + escapeHtml(block.title) + '</h2>';
            html += '</div>';

            // Info Banner (SEO Tip)
            html += '<div class="quiz-info-banner" data-block="' + block.id + '" style="display:none;">';
            html += '  <span class="quiz-info-banner-icon">ℹ</span>';
            html += '  <span class="quiz-info-banner-text">' + escapeHtml(BANNER_TEXTS[block.id] || '') + '</span>';
            html += '  <button type="button" class="quiz-info-banner-close" aria-label="Закрыть">&times;</button>';
            html += '</div>';

            html += '<div class="quiz-questions">';

            // Показываем только первый (текущий) вопрос в блоке
            block.questions.forEach(function (q, qi) {
                var answered = state.answers[q.id] !== undefined;
                var isFirstUnanswered = false;
                if (!answered && !isFirstUnanswered) {
                    // Находим первый неотвеченный вопрос
                    var foundUnanswered = false;
                    for (var pi = 0; pi < qi; pi++) {
                        if (state.answers[block.questions[pi].id] === undefined) {
                            foundUnanswered = true;
                            break;
                        }
                    }
                    isFirstUnanswered = !foundUnanswered;
                }
                // Показываем вопрос если он первый неотвеченный, или все уже отвечены
                var showQ = answered || (qi === 0) || isFirstUnanswered || (getAnsweredCount(index) === block.questions.length);
                // Если все отвечены - показываем последний вопрос
                if (getAnsweredCount(index) === block.questions.length) {
                    showQ = (qi === block.questions.length - 1);
                } else if (!answered && !isFirstUnanswered) {
                    showQ = false;
                }

                html += '<div class="quiz-question' + (answered ? ' answered' : '') + '" data-qid="' + q.id + '" style="' + (showQ ? '' : 'display:none;') + '">';
                html += '  <div class="quiz-question-text">' + escapeHtml(q.text) + '</div>';
                html += '  <div class="quiz-options">';

                q.options.forEach(function (opt, oi) {
                    var selected = state.answers[q.id] === oi;
                    html += '    <label class="quiz-option' + (selected ? ' selected' : '') + '">';
                    html += '      <input type="radio" name="' + q.id + '" value="' + oi + '"' + (selected ? ' checked' : '') + '>';
                    html += '      <span class="quiz-option-radio"></span>';
                    html += '      <span class="quiz-option-text">' + escapeHtml(opt) + '</span>';
                    html += '    </label>';
                });

                html += '  </div>';
                html += '</div>';
            });

            html += '</div>';

            html += '<div class="quiz-block-progress">';
            html += '  <span class="quiz-q-progress-text">Вопрос ' + (getAnsweredCount(index) + 1) + ' из ' + block.questions.length + '</span>';
            html += '</div>';

            container.innerHTML = html;
        });

        // Сразу обновляем видимость вопросов
        showCurrentQuestions();
    }

    /**
     * Показывает текущий вопрос в каждом блоке, остальные скрывает.
     */
    function showCurrentQuestions() {
        els.blockContainers.forEach(function (container, index) {
            var block = QUIZ_DATA[index];
            if (!block) return;

            var questions = container.querySelectorAll('.quiz-question');
            var answeredCount = getAnsweredCount(index);
            var totalQuestions = block.questions.length;

            // Если все вопросы отвечены — показываем последний (уже отвеченный)
            if (answeredCount >= totalQuestions) {
                questions.forEach(function (q, qi) {
                    q.style.display = 'none';
                });
                var radios = container.querySelectorAll('input[type="radio"]');
                radios.forEach(function (r) { r.disabled = true; });
                var progressText = container.querySelector('.quiz-q-progress-text');
                if (progressText) progressText.textContent = '✅ Блок завершён';
                var counter = container.querySelector('.quiz-q-counter');
                if (counter) counter.textContent = totalQuestions;
                var progressDiv = container.querySelector('.quiz-block-progress');
                if (progressDiv) { progressDiv.style.display = 'block'; progressDiv.classList.add('complete'); }

                // Кнопка «Назад» активна — можно вернуться к предыдущему вопросу
                els.backBtn.disabled = false;
                return;
            }

            // Ищем первый неотвеченный вопрос
            var firstUnanswered = -1;
            for (var qi = 0; qi < totalQuestions; qi++) {
                if (state.answers[block.questions[qi].id] === undefined) {
                    firstUnanswered = qi;
                    break;
                }
            }

            questions.forEach(function (q, qi) {
                // Показываем первый неотвеченный, остальные скрываем
                q.style.display = (qi === firstUnanswered) ? 'block' : 'none';

                // Если вопрос не отвечен — сбрасываем визуальное состояние
                if (qi === firstUnanswered) {
                    var qBlock = QUIZ_DATA[index];
                    var qData = qBlock ? qBlock.questions[qi] : null;
                    if (qData && state.answers[qData.id] === undefined) {
                        q.classList.remove('answered');
                        var opts = q.querySelectorAll('.quiz-option');
                        opts.forEach(function (lbl) {
                            lbl.classList.remove('selected');
                            var inp = lbl.querySelector('input');
                            if (inp) inp.checked = false;
                        });
                    }
                }
            });

            // Обновляем счётчик
            var counter = container.querySelector('.quiz-q-counter');
            if (counter) {
                counter.textContent = firstUnanswered + 1;
            }
            var progressText = container.querySelector('.quiz-q-progress-text');
            if (progressText) {
                progressText.textContent = 'Вопрос ' + (firstUnanswered + 1) + ' из ' + totalQuestions;
            }

            // Разблокируем радио
            var radios = container.querySelectorAll('input[type="radio"]');
            radios.forEach(function (r) { r.disabled = false; });

        });

        // Кнопка «Назад» — только для активного блока
        var activeAnswered = getAnsweredCount(state.currentBlock);
        els.backBtn.disabled = (activeAnswered <= 0);
    }

    /* ============================================
       ВСПОМОГАТЕЛЬНЫЕ
       ============================================ */
    function escapeHtml(str) {
        if (typeof str !== 'string') return '';
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    function getBlockQuestionCount(blockIndex) {
        return QUIZ_DATA[blockIndex] ? QUIZ_DATA[blockIndex].questions.length : 0;
    }

    function getAnsweredCount(blockIndex) {
        var block = QUIZ_DATA[blockIndex];
        if (!block) return 0;
        var count = 0;
        block.questions.forEach(function (q) {
            if (state.answers[q.id] !== undefined) count++;
        });
        return count;
    }

    function isBlockComplete(blockIndex) {
        return getAnsweredCount(blockIndex) === getBlockQuestionCount(blockIndex);
    }

    function getTotalAnswered() {
        var count = 0;
        for (var key in state.answers) {
            if (state.answers.hasOwnProperty(key)) count++;
        }
        return count;
    }



    /* ============================================
       ПРОГРЕСС (общий)
       ============================================ */
    function updateProgress() {
        // Заглушка — прогресс отображается внутри каждого блока
    }

    /* ============================================
       ИНФО-БАННЕРЫ
       ============================================ */
    function showBanner(blockIndex) {
        var block = QUIZ_DATA[blockIndex];
        if (!block) return;

        // Не показываем, если уже показали при первом входе
        if (state.bannerShown[block.id]) return;

        var banner = els.screens[blockIndex].querySelector('.quiz-info-banner');
        if (banner) {
            banner.style.display = 'flex';
            state.bannerShown[block.id] = true;
        }
    }

    function setupBannerClose() {
        document.addEventListener('click', function (e) {
            var closeBtn = e.target.closest('.quiz-info-banner-close');
            if (closeBtn) {
                var banner = closeBtn.closest('.quiz-info-banner');
                if (banner) {
                    banner.style.display = 'none';
                }
            }
        });
    }

    /* ============================================
       НАВИГАЦИЯ
       ============================================ */
    function showBlock(blockIndex, direction) {
        var totalBlocks = QUIZ_DATA.length;

        if (blockIndex < 0) blockIndex = 0;
        if (blockIndex >= totalBlocks) {
            showFinalScreen();
            return;
        }

        // Скрываем все блоки и финал
        els.screens.forEach(function (s) { 
            s.classList.remove('active', 'slide-left', 'slide-right'); 
            s.style.display = 'none';
        });
        els.finalScreen.classList.remove('active');

        // Показываем нужный блок
        els.screens[blockIndex].classList.add('active');
        els.screens[blockIndex].style.display = 'block';

        // Анимация
        if (direction === 'next') {
            els.screens[blockIndex].style.animation = 'none';
            els.screens[blockIndex].offsetHeight; // reflow
            els.screens[blockIndex].style.animation = '';
        } else if (direction === 'prev') {
            els.screens[blockIndex].style.animation = 'none';
            els.screens[blockIndex].offsetHeight;
            els.screens[blockIndex].style.animation = '';
        }

        // Показываем навигацию
        els.nav.style.display = 'flex';

        // Обновляем видимость вопросов (первый неотвеченный)
        showCurrentQuestions();

        // Кнопки
        // Кнопка «Назад» обновится в showCurrentQuestions() (активна со второго ответа)
        els.backBtn.disabled = true;

        // Обновляем текст кнопки Далее
        var block = QUIZ_DATA[blockIndex];
        var isLastBlock = (blockIndex === totalBlocks - 1);
        if (els.nextBtnText) {
            els.nextBtnText.textContent = isLastBlock ? 'Готово' : 'Далее';
        }
        // Добавляем иконку стрелки для промежуточных блоков
        var arrowSpan = els.nextBtn.querySelector('.quiz-nav-next-arrow');
        if (arrowSpan) {
            arrowSpan.textContent = isLastBlock ? '→' : '→';
        }

        // Проверяем заполненность блока
        updateNextButton(blockIndex);

        // Показываем баннер
        showBanner(blockIndex);

        // Свайп-подсказка на мобильных
        if (els.swipeHint) {
            els.swipeHint.style.display = (window.innerWidth < 768 && blockIndex < totalBlocks - 1) ? 'block' : 'none';
        }

        // Обновляем прогресс
        updateProgress();

        // Прокрутка вверх
        window.scrollTo({ top: 0, behavior: 'smooth' });

        state.currentBlock = blockIndex;
    }

    function updateNextButton(blockIndex) {
        var complete = isBlockComplete(blockIndex);
        els.nextBtn.disabled = !complete;
    }

    function goNext() {
        var blockIndex = state.currentBlock;
        if (!isBlockComplete(blockIndex)) return;

        if (blockIndex === QUIZ_DATA.length - 1) {
            // Последний блок — показываем финал
            showFinalScreen();
        } else {
            showBlock(blockIndex + 1, 'next');
        }
    }

    function goBack() {
        var blockIndex = state.currentBlock;
        var block = QUIZ_DATA[blockIndex];
        if (!block) return;

        // Находим последний отвеченный вопрос
        var lastAnswered = -1;
        for (var qi = 0; qi < block.questions.length; qi++) {
            if (state.answers[block.questions[qi].id] !== undefined) {
                lastAnswered = qi;
            }
        }

        if (lastAnswered >= 0) {
            // Удаляем последний ответ и перерисовываем блоки
            delete state.answers[block.questions[lastAnswered].id];
            renderQuestions();
            showCurrentQuestions();
            updateNextButton(blockIndex);
            updateProgress();
        }
    }

    /* ============================================
       ФИНАЛЬНЫЙ ЭКРАН
       ============================================ */
    function showFinalScreen() {
        els.screens.forEach(function (s) {
            s.classList.remove('active');
            s.style.display = 'none';
        });
        els.finalScreen.classList.add('active');
        els.finalScreen.style.display = 'block';

        // Прячем кнопки навигации
        els.nav.style.display = 'none';
        if (els.swipeHint) els.swipeHint.style.display = 'none';

        // Заполняем итоговый прогресс
        updateProgress();

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /* ============================================
       ОБРАБОТКА ВЫБОРА ОТВЕТОВ (делегирование)
       ============================================ */
    function setupAnswerHandler() {
        document.addEventListener('change', function (e) {
            var radio = e.target.closest('.quiz-options input[type="radio"]');
            if (!radio) return;

            var qid = radio.name;
            var value = parseInt(radio.value, 10);

            // Сохраняем ответ
            state.answers[qid] = value;

            // Визуальное обновление опций в этом вопросе
            var question = radio.closest('.quiz-question');
            if (question) {
                question.classList.add('answered');
                var labels = question.querySelectorAll('.quiz-option');
                labels.forEach(function (lbl) {
                    var inp = lbl.querySelector('input');
                    if (inp && inp.checked) {
                        lbl.classList.add('selected');
                    } else {
                        lbl.classList.remove('selected');
                    }
                });
            }

                // Анимация: fade out вопрос, затем показываем следующий
                question.style.animation = 'fadeSlideOut 200ms ease forwards';
            }

            // Через 300мс показываем следующий вопрос или обновляем навигацию
            setTimeout(function () {
                var blockIndex = state.currentBlock;
                var block = QUIZ_DATA[blockIndex];
                if (!block) return;

                var answeredCount = getAnsweredCount(blockIndex);
                var totalQuestions = block.questions.length;

                if (answeredCount >= totalQuestions) {
                    // Все вопросы отвечены — не скроллим, блок остаётся на месте
                    showCurrentQuestions();
                    updateNextButton(blockIndex);
                    updateProgress();
                } else {
                    // Есть ещё вопросы — показываем следующий
                    showCurrentQuestions();
                    updateProgress();

                    // Анимация появления нового вопроса
                    var container = els.blockContainers[blockIndex];
                    if (container) {
                        var visibleQuestion = container.querySelector('.quiz-question[style*="block"]');
                        if (visibleQuestion) {
                            visibleQuestion.style.animation = 'fadeSlideIn 300ms ease forwards';
                        }
                    }

                    // Плавный скролл к следующему вопросу
                    var container = els.blockContainers[blockIndex];
                    if (container) {
                        container.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            }, 250);
        });
    }

    /* ============================================
       ТЕЛЕФОННАЯ МАСКА
       ============================================ */
    function setupPhoneMask() {
        var phoneInput = els.formPhone;
        if (!phoneInput) return;

        phoneInput.addEventListener('input', function () {
            var val = phoneInput.value.replace(/[^\d+]/g, '');
            if (!val.startsWith('+')) {
                val = '+7' + val.replace(/^\+?7?/, '');
            }
            phoneInput.value = val;
        });

        phoneInput.addEventListener('blur', function () {
            var val = phoneInput.value;
            if (val === '+' || val === '+7' || val === '') {
                phoneInput.value = '';
            } else if (!/^\+7\d/.test(val)) {
                phoneInput.value = '+7' + val.replace(/^\+?7?/, '');
            }
        });
    }

    /* ============================================
       ВАЛИДАЦИЯ ФОРМЫ
       ============================================ */
    function validateForm() {
        var isValid = true;

        // Имя
        var name = els.formName.value.trim();
        if (!name || name.length > 100) {
            showFieldError('quiz-name-error', !name ? 'Пожалуйста, укажите ваше имя' : 'Имя должно быть не длиннее 100 символов');
            els.formName.classList.add('error');
            isValid = false;
        } else {
            hideFieldError('quiz-name-error');
            els.formName.classList.remove('error');
        }

        // Компания
        var company = els.formCompany.value.trim();
        if (!company || company.length > 200) {
            showFieldError('quiz-company-error', !company ? 'Пожалуйста, укажите название компании' : 'Название должно быть не длиннее 200 символов');
            els.formCompany.classList.add('error');
            isValid = false;
        } else {
            hideFieldError('quiz-company-error');
            els.formCompany.classList.remove('error');
        }

        // Email
        var email = els.formEmail.value.trim();
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            showFieldError('quiz-email-error', 'Пожалуйста, укажите корректный e-mail');
            els.formEmail.classList.add('error');
            isValid = false;
        } else {
            hideFieldError('quiz-email-error');
            els.formEmail.classList.remove('error');
        }

        // Телефон
        var phone = els.formPhone.value.trim();
        var phoneClean = phone.replace(/[^\d+]/g, '');
        if (!phoneClean || phoneClean.length < 10) {
            showFieldError('quiz-phone-error', 'Пожалуйста, укажите корректный номер телефона');
            els.formPhone.classList.add('error');
            isValid = false;
        } else {
            hideFieldError('quiz-phone-error');
            els.formPhone.classList.remove('error');
        }

        // Чекбоксы
        if (!els.formConsent.checked) {
            showFieldError('quiz-consent-error', 'Необходимо согласие на обработку персональных данных');
            isValid = false;
        } else {
            hideFieldError('quiz-consent-error');
        }

        if (!els.formPolicy.checked) {
            showFieldError('quiz-policy-error', 'Необходимо подтвердить ознакомление с Политикой');
            isValid = false;
        } else {
            hideFieldError('quiz-policy-error');
        }

        return isValid;
    }

    function showFieldError(id, msg) {
        var el = document.getElementById(id);
        if (el) {
            el.textContent = msg;
            el.classList.add('visible');
        }
    }

    function hideFieldError(id) {
        var el = document.getElementById(id);
        if (el) {
            el.classList.remove('visible');
            el.textContent = '';
        }
    }

    /* ============================================
       СБОР ОТВЕТОВ ДЛЯ ОТПРАВКИ
       ============================================ */
    function buildFormattedAnswers() {
        var lines = [];
        QUIZ_DATA.forEach(function (block, bi) {
            lines.push('');
            lines.push('=== ' + block.title + ' ===');
            block.questions.forEach(function (q) {
                var answerIdx = state.answers[q.id];
                var answerText = (answerIdx !== undefined && q.options[answerIdx]) ? q.options[answerIdx] : 'Не отвечен';
                lines.push(q.text + ' → ' + answerText);
            });
        });
        return lines.join('\n');
    }

    function buildPayload(submitType) {
        var name = els.formName.value.trim();
        var company = els.formCompany.value.trim();
        var email = els.formEmail.value.trim();
        var phone = els.formPhone.value.trim();

        return {
            action: 'granduchet_quiz_submit',
            type: submitType, // 'report' or 'consult'
            name: name,
            company: company,
            email: email,
            phone: phone,
            consent: els.formConsent.checked ? 1 : 0,
            policy: els.formPolicy.checked ? 1 : 0,
            answers: state.answers,
            formatted: buildFormattedAnswers()
        };
    }

    /* ============================================
       ОТПРАВКА ФОРМЫ
       ============================================ */
    function submitQuiz(submitType) {
        if (state.isSubmitting) return;
        if (!validateForm()) return;

        state.isSubmitting = true;

        // Disable buttons and show loading
        var buttons = [els.submitReport, els.submitConsult];
        buttons.forEach(function (btn) {
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<span class="quiz-loading"></span> Отправка...';
            }
        });

        var payload = buildPayload(submitType);

        // Отправка через WordPress REST API или AJAX
        var xhr = new XMLHttpRequest();
        var isConsult = submitType === 'consult';
        var defaultUrl = isConsult ? '/wp-json/granduchet-quiz/v1/consultation' : '/wp-json/granduchet-quiz/v1/submit';
        var ajaxUrl = window.granduchetQuiz ? (isConsult ? window.granduchetQuiz.consultUrl : window.granduchetQuiz.ajaxUrl) : defaultUrl;

        xhr.open('POST', ajaxUrl, true);
        xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
        var nonce = window.granduchetQuiz ? window.granduchetQuiz.nonce : '';
        if (nonce) {
            xhr.setRequestHeader('X-WP-Nonce', nonce);
        }

        xhr.onload = function () {
            state.isSubmitting = false;

            if (xhr.status >= 200 && xhr.status < 300) {
                // Яндекc.Метрика цель
                sendYandexGoal('quiz_submit');

                showThankYou();
            } else {
                // Ошибка — пробуем fallback через PHP-обработчик
                fallbackSubmit(payload);
            }

            // Reset buttons
            resetSubmitButtons();
        };

        xhr.onerror = function () {
            state.isSubmitting = false;
            fallbackSubmit(payload);
            resetSubmitButtons();
        };

        // Отправляем как JSON для REST API
        xhr.send(JSON.stringify(payload));
    }

    function fallbackSubmit(payload) {
        // Прямая отправка на PHP-обработчик если AJAX не сработал
        var formData = new FormData();
        formData.append('action', 'granduchet_quiz_submit');
        formData.append('type', payload.type);
        formData.append('name', payload.name);
        formData.append('company', payload.company);
        formData.append('email', payload.email);
        formData.append('phone', payload.phone);
        formData.append('consent', payload.consent);
        formData.append('policy', payload.policy);
        formData.append('formatted', payload.formatted);

        var fallbackXhr = new XMLHttpRequest();
        fallbackXhr.open('POST', '/wp-content/themes/granduchet/quiz-handler.php', true);

        fallbackXhr.onload = function () {
            sendYandexGoal('quiz_submit');
            showThankYou();
        };

        fallbackXhr.onerror = function () {
            // Совсем ничего не работает — показываем спасибо
            showThankYou();
        };

        fallbackXhr.send(formData);
    }

    function resetSubmitButtons() {
        var buttons = [els.submitReport, els.submitConsult];
        buttons.forEach(function (btn) {
            if (btn) {
                btn.disabled = false;
            }
        });
        if (els.submitReport) {
            els.submitReport.innerHTML = 'Получить персональный отчет по цифровой зрелости бизнеса';
        }
        if (els.submitConsult) {
            els.submitConsult.innerHTML = 'Получить персональную консультацию по автоматизации';
        }
    }

    /* ============================================
       ЭКРАН БЛАГОДАРНОСТИ
       ============================================ */
    function showThankYou() {
        els.finalScreen.classList.remove('active');
        els.finalScreen.style.display = 'none';
        els.thankyou.classList.add('active');
        els.thankyou.style.display = 'flex';

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /* ============================================
       ЯНДЕКС.МЕТРИКА
       ============================================ */
    function sendYandexGoal(goalName) {
        if (typeof yaCounterXXXXXXXX !== 'undefined') {
            try {
                yaCounterXXXXXXXX.reachGoal(goalName);
            } catch (e) {
                // игнорируем
            }
        }

        // Также пробуем dataLayer (Google Tag Manager / общий)
        if (typeof dataLayer !== 'undefined') {
            try {
                dataLayer.push({ 'event': goalName });
            } catch (e) {
                // игнорируем
            }
        }

        // Событие в localStorage для возможной ретроспективной отправки
        try {
            var events = JSON.parse(localStorage.getItem('granduchet_quiz_events') || '[]');
            events.push({ name: goalName, time: new Date().toISOString() });
            localStorage.setItem('granduchet_quiz_events', JSON.stringify(events));
        } catch (e) {
            // игнорируем
        }
    }

    /* ============================================
       СВАЙПЫ (горизонтальные)
       ============================================ */
    function setupSwipeDetection() {
        var touchStartX = 0;
        var touchStartY = 0;
        var touchEndX = 0;
        var touchEndY = 0;
        var swiping = false;
        var swiped = false;

        document.addEventListener('touchstart', function (e) {
            var target = e.target;
            // Не реагируем на свайпы внутри формы или инпутов
            if (target.closest('.quiz-final-form') || target.closest('.quiz-thankyou') || target.closest('.quiz-landing')) {
                return;
            }

            var touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchEndX = touch.clientX;
            touchEndY = touch.clientY;
            swiping = true;
            swiped = false;
        }, { passive: true });

        document.addEventListener('touchmove', function (e) {
            if (!swiping) return;
            var touch = e.touches[0];
            touchEndX = touch.clientX;
            touchEndY = touch.clientY;
        }, { passive: true });

        document.addEventListener('touchend', function (e) {
            if (!swiping || swiped) return;
            swiping = false;

            var dx = touchEndX - touchStartX;
            var dy = touchEndY - touchStartY;

            // Только горизонтальные свайпы, минимум 50px
            if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;

            swiped = true;

            if (dx < 0 && isBlockComplete(state.currentBlock)) {
                // Свайп влево → Далее
                goNext();
            } else if (dx > 0 && state.currentBlock > 0) {
                // Свайп вправо → Назад
                goBack();
            }
        }, { passive: true });
    }

    /* ============================================
       LAZY LOADING INIT
       ============================================ */
    function initQuiz() {
        if (state.initialized) return;
        state.initialized = true;

        // Отображаем вопросы
        renderQuestions();

        // Прячем лендинг, показываем 1-й блок
        els.landing.style.display = 'none';

        // Показываем навигацию
        els.nav.style.display = 'flex';

        // Показываем первый блок
        showBlock(0, 'next');
    }

    function setupLazyLoading() {
        // Кнопка «Начать тест» — единственный способ запуска
        els.startBtn.addEventListener('click', function (e) {
            e.preventDefault();
            initQuiz();
        });
    }

    /* ============================================
       ИНИЦИАЛИЗАЦИЯ
       ============================================ */
    function init() {
        cacheDom();

        if (!els.landing || !els.startBtn) return;

        // Состояние лендинга включено
        els.landing.style.display = 'flex';

        // Навигация скрыта изначально
        els.nav.style.display = 'none';

        // Скрываем все блоки и финал
        els.screens.forEach(function (s) { s.style.display = 'none'; });
        els.finalScreen.style.display = 'none';
        els.thankyou.style.display = 'none';

        // Устанавливаем обработчики
        setupAnswerHandler();
        setupBannerClose();
        setupPhoneMask();
        setupSwipeDetection();
        setupLazyLoading();

        // Кнопки навигации
        els.nextBtn.addEventListener('click', goNext);
        els.backBtn.addEventListener('click', goBack);



        // Кнопки отправки
        els.submitReport.addEventListener('click', function (e) {
            e.preventDefault();
            submitQuiz('report');
        });

        els.submitConsult.addEventListener('click', function (e) {
            e.preventDefault();
            submitQuiz('consult');
        });

        // Валидация полей в реальном времени (снимаем ошибку при вводе)
        var formInputs = [els.formName, els.formCompany, els.formEmail, els.formPhone];
        formInputs.forEach(function (input) {
            if (!input) return;
            input.addEventListener('input', function () {
                this.classList.remove('error');
                var errorId = this.getAttribute('data-error');
                if (errorId) hideFieldError(errorId);
            });
        });

        // Чекбоксы
        [els.formConsent, els.formPolicy].forEach(function (cb) {
            if (!cb) return;
            cb.addEventListener('change', function () {
                var errorId = this.getAttribute('data-error');
                if (errorId && this.checked) hideFieldError(errorId);
            });
        });

        // Keyboard support
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && state.initialized) {
                var activeScreen = document.querySelector('.quiz-screen.active');
                if (activeScreen && isBlockComplete(state.currentBlock)) {
                    goNext();
                }
                if (els.finalScreen.classList.contains('active')) {
                    // Не отправляем форму по Enter случайно
                }
            }

            if (e.key === 'ArrowRight' && state.initialized && isBlockComplete(state.currentBlock)) {
                goNext();
            }

            if (e.key === 'ArrowLeft' && state.initialized && state.currentBlock > 0) {
                goBack();
            }
        });

        console.log('Гранд Учет — Квиз цифровизации загружен');
    }

    /* ============================================
       СТАРТ (когда DOM готов)
       ============================================ */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
