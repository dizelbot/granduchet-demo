<?php
/**
 * Quiz Handler — «Оценка уровня цифровизации бизнеса»
 * 
 * Принимает POST-запрос с данными квиза, валидирует,
 * отправляет письмо и возвращает JSON-ответ.
 * 
 * Использование:
 *   require_once 'quiz-handler.php';
 *   $handler = new DigitalizationQuizHandler();
 *   $handler->handle();
 *
 * @package GrandUchet\Quiz
 * @version 1.0.0
 */

// ─── Конфигурация ──────────────────────────────────────────────────────
// Меняй этот email — сюда будут приходить заявки.
define('QUIZ_RECIPIENT_EMAIL', 'email@granduchet.ru');
define('QUIZ_RECIPIENT_NAME',  'Гранд Учет');
define('QUIZ_FROM_EMAIL',      'noreply@granduchet.ru');
define('QUIZ_FROM_NAME',       'Квиз «Цифровизация бизнеса»');
define('QUIZ_LOG_DIR',         __DIR__ . '/../logs');
define('QUIZ_LOG_FILE',        'quiz-errors.log');

// ─── Вопросы (для построения тела письма) ──────────────────────────────
define('QUIZ_QUESTIONS', serialize([
    1  => 'Как осуществляется загрузка банковских выписок?',
    2  => 'Как формируются счета и закрывающие документы?',
    3  => 'Используется ли ЭДО с контрагентами?',
    4  => 'Есть ли распознавание первички?',
    5  => 'Ведете ли управленческий учет?',
    6  => 'Как вы организуете архив бухгалтерских документов?',
    7  => 'Сколько занимает подписание документов?',
    8  => 'Как организовано согласование?',
    9  => 'Есть ли контроль сроков согласования?',
    10 => 'Как происходит оформление сотрудников?',
    11 => 'Как подписывают кадровые документы?',
    12 => 'Время оформления нового сотрудника?',
    13 => 'Используются ли RPA роботы?',
    14 => 'Обработка входящих писем и документов?',
    15 => 'Интеграции между ключевыми системами?',
    16 => 'Автоматическое формирование отчетов?',
    17 => 'Используются ли дашборды?',
    18 => 'Автоматические уведомления о проблемах?',
    19 => 'Доля автоматических операций?',
]));

if (!class_exists('DigitalizationQuizHandler')) :

class DigitalizationQuizHandler
{
    /**
     * @var array Валидированные и санитизированные данные.
     */
    private array $data = [];

    /**
     * @var array Массив ошибок валидации.
     */
    private array $errors = [];

    /**
     * Главный метод: принимает запрос, обрабатывает, отдаёт JSON.
     */
    public function handle(): void
    {
        try {
            // 1. Распарсить входные данные
            $input = $this->parseInput();

            // 2. Валидировать
            if (!$this->validate($input)) {
                $this->jsonResponse(false, $this->errors);
                return;
            }

            // 3. Отправить письмо руководителю
            if (!$this->sendEmail()) {
                $this->jsonResponse(false, 'Ошибка при отправке письма. Пожалуйста, попробуйте позже.');
                return;
            }

            // 4. Успех
            $this->jsonResponse(true, 'Спасибо! Ваши ответы отправлены. Мы свяжемся с вами в ближайшее время.');
        } catch (\Throwable $e) {
            $this->logError('Fatal error: ' . $e->getMessage(), $e->getTraceAsString());
            $this->jsonResponse(false, 'Произошла внутренняя ошибка. Пожалуйста, попробуйте позже.');
        }
    }

    // ─── Парсинг входа ──────────────────────────────────────────────

    /**
     * Распознаёт JSON и form-data, нормализует в массив.
     */
    private function parseInput(): array
    {
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

        if (str_contains($contentType, 'application/json')) {
            $raw = file_get_contents('php://input');
            $data = json_decode($raw, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                return [];
            }
            return $data ?? [];
        }

        // form-data или стандартный POST
        return $_POST;
    }

    // ─── Валидация ──────────────────────────────────────────────────

    /**
     * Проверяет все обязательные поля.
     *
     * @param array $input
     * @return bool
     */
    private function validate(array $input): bool
    {
        $this->errors = [];

        // Поля формы
        $name    = trim($input['name']    ?? '');
        $company = trim($input['company'] ?? '');
        $email   = trim($input['email']   ?? '');
        $phone   = trim($input['phone']   ?? '');

        // Чекбоксы согласия
        $consent     = $input['consent']     ?? '';
        $policy      = $input['policy']      ?? '';

        // Имя
        if ($name === '') {
            $this->errors[] = 'Поле «Имя» обязательно для заполнения.';
        } elseif (mb_strlen($name) > 150) {
            $this->errors[] = 'Имя не должно превышать 150 символов.';
        } else {
            $this->data['name'] = $this->sanitizeString($name);
        }

        // Компания
        if ($company === '') {
            $this->errors[] = 'Поле «Компания» обязательно для заполнения.';
        } elseif (mb_strlen($company) > 250) {
            $this->errors[] = 'Название компании не должно превышать 250 символов.';
        } else {
            $this->data['company'] = $this->sanitizeString($company);
        }

        // E-mail
        if ($email === '') {
            $this->errors[] = 'Поле «E-mail» обязательно для заполнения.';
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->errors[] = 'Укажите корректный e-mail адрес.';
        } else {
            $this->data['email'] = $this->sanitizeEmail($email);
        }

        // Телефон
        if ($phone === '') {
            $this->errors[] = 'Поле «Телефон» обязательно для заполнения.';
        } elseif (!preg_match('/^\+?7\d{10}$/', preg_replace('/[^+\d]/', '', $phone))) {
            $this->errors[] = 'Укажите корректный номер телефона в формате +7(___) ___-__-__';
        } else {
            $this->data['phone'] = $this->sanitizeString(preg_replace('/[^+\d]/', '', $phone));
        }

        // Согласие на обработку ПД
        if (strtolower($consent) !== 'on' && strtolower($consent) !== '1' && strtolower($consent) !== 'true') {
            $this->errors[] = 'Необходимо дать согласие на обработку персональных данных.';
        }

        // Согласие с Политикой
        if (strtolower($policy) !== 'on' && strtolower($policy) !== '1' && strtolower($policy) !== 'true') {
            $this->errors[] = 'Необходимо подтвердить ознакомление с Политикой обработки ПД.';
        }

        // Вопросы (ответы) — опциональный контроль, не блокируем если не переданы
        $answersJson = $input['answers'] ?? '[]';
        if (is_string($answersJson)) {
            $answers = json_decode(stripslashes($answersJson), true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($answers)) {
                $sanitized = [];
                foreach ($answers as $qId => $answer) {
                    $qId = (int) $qId;
                    if ($qId >= 1 && $qId <= 19) {
                        $sanitized[$qId] = $this->sanitizeString((string) $answer);
                    }
                }
                $this->data['answers'] = $sanitized;
            } else {
                $this->data['answers'] = [];
            }
        } elseif (is_array($answersJson)) {
            $sanitized = [];
            foreach ($answersJson as $qId => $answer) {
                $qId = (int) $qId;
                if ($qId >= 1 && $qId <= 19) {
                    $sanitized[$qId] = $this->sanitizeString((string) $answer);
                }
            }
            $this->data['answers'] = $sanitized;
        } else {
            $this->data['answers'] = [];
        }

        return empty($this->errors);
    }

    // ─── Санитизация ────────────────────────────────────────────────

    private function sanitizeString(string $value): string
    {
        $value = strip_tags($value);
        $value = htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
        return trim($value);
    }

    private function sanitizeEmail(string $email): string
    {
        $email = filter_var($email, FILTER_SANITIZE_EMAIL);
        return filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : '';
    }

    // ─── Отправка письма ────────────────────────────────────────────

    /**
     * Отправляет письмо с контактами и ответами.
     *
     * @return bool
     */
    private function sendEmail(): bool
    {
        $to      = QUIZ_RECIPIENT_EMAIL;
        $subject = sprintf(
            'Новая заявка: Тест на цифровизацию от %s (%s)',
            $this->data['name'],
            $this->data['company']
        );
        $message = $this->buildEmailBody();
        $headers = $this->buildEmailHeaders();

        // Пробуем wp_mail, если WP загружен (через плагин)
        if (function_exists('wp_mail')) {
            $sent = wp_mail($to, $subject, $message, $headers);
            if ($sent) {
                return true;
            }
            $this->logError('wp_mail failed', '');
        }

        // Fallback на mail()
        $sent = @mail($to, $subject, $message, $headers);
        if (!$sent) {
            $this->logError('mail() failed', '');
            return false;
        }

        return true;
    }

    /**
     * Строит HTML-тело письма.
     *
     * @return string
     */
    private function buildEmailBody(): string
    {
        $questions = unserialize(QUIZ_QUESTIONS);

        $body = '<html><body style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">';
        $body .= '<h2 style="color: #832926;">Новая заявка: Тест на цифровизацию</h2>';

        // Контактные данные
        $body .= '<table style="border-collapse: collapse; width: 100%; max-width: 600px; margin-bottom: 20px;">';
        $body .= sprintf('<tr><td style="padding: 8px; font-weight: bold; width: 120px;">Имя:</td><td style="padding: 8px;">%s</td></tr>', $this->data['name']);
        $body .= sprintf('<tr><td style="padding: 8px; font-weight: bold;">Компания:</td><td style="padding: 8px;">%s</td></tr>', $this->data['company']);
        $body .= sprintf('<tr><td style="padding: 8px; font-weight: bold;">E-mail:</td><td style="padding: 8px;">%s</td></tr>', $this->data['email']);
        $body .= sprintf('<tr><td style="padding: 8px; font-weight: bold;">Телефон:</td><td style="padding: 8px;">%s</td></tr>', $this->data['phone']);
        $body .= '</table>';

        // Ответы на вопросы
        $body .= '<h3 style="color: #832926;">Ответы на вопросы</h3>';
        $body .= '<table style="border-collapse: collapse; width: 100%; max-width: 600px;">';

        foreach ($questions as $qId => $question) {
            $answer = $this->data['answers'][$qId] ?? '—';
            $body .= sprintf(
                '<tr><td style="padding: 6px 8px; border-bottom: 1px solid #eee; vertical-align: top; width: 40px; color: #888;">%d.</td><td style="padding: 6px 8px; border-bottom: 1px solid #eee;">%s</td><td style="padding: 6px 8px; border-bottom: 1px solid #eee; font-weight: bold;">%s</td></tr>',
                $qId,
                $question,
                $answer
            );
        }

        $body .= '</table>';
        $body .= '<p style="margin-top: 20px; font-size: 12px; color: #999;">Отправлено через квиз на granduchet.ru</p>';
        $body .= '</body></html>';

        return $body;
    }

    /**
     * Строит заголовки для HTML-письма.
     *
     * @return string
     */
    private function buildEmailHeaders(): string
    {
        $headers  = "MIME-Version: 1.0\r\n";
        $headers .= "Content-type: text/html; charset=UTF-8\r\n";
        $headers .= sprintf("From: %s <%s>\r\n", QUIZ_FROM_NAME, QUIZ_FROM_EMAIL);
        $headers .= sprintf("Reply-To: %s <%s>\r\n", $this->data['name'], $this->data['email']);
        $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
        return $headers;
    }

    // ─── Альтернативная отправка (консультация) ────────────────────

    /**
     * Отправляет письмо для кнопки «Получить консультацию».
     *
     * @param array $contactData Поля: name, company, email, phone
     * @return bool
     */
    public function sendConsultationRequest(array $contactData): bool
    {
        $to      = QUIZ_RECIPIENT_EMAIL;
        $subject = sprintf(
            'Новая заявка: Консультация по автоматизации от %s (%s)',
            $contactData['name'] ?? '',
            $contactData['company'] ?? ''
        );

        $body  = '<html><body style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">';
        $body .= '<h2 style="color: #832926;">Запрос на персональную консультацию по автоматизации</h2>';
        $body .= '<table style="border-collapse: collapse; width: 100%; max-width: 600px;">';
        $body .= sprintf('<tr><td style="padding: 8px; font-weight: bold; width: 120px;">Имя:</td><td style="padding: 8px;">%s</td></tr>', $contactData['name'] ?? '');
        $body .= sprintf('<tr><td style="padding: 8px; font-weight: bold;">Компания:</td><td style="padding: 8px;">%s</td></tr>', $contactData['company'] ?? '');
        $body .= sprintf('<tr><td style="padding: 8px; font-weight: bold;">E-mail:</td><td style="padding: 8px;">%s</td></tr>', $contactData['email'] ?? '');
        $body .= sprintf('<tr><td style="padding: 8px; font-weight: bold;">Телефон:</td><td style="padding: 8px;">%s</td></tr>', $contactData['phone'] ?? '');
        $body .= '</table>';
        $body .= '<p style="margin-top: 20px; font-size: 12px; color: #999;">Отправлено через квиз на granduchet.ru</p>';
        $body .= '</body></html>';

        $headers = $this->buildEmailHeaders();

        if (function_exists('wp_mail')) {
            return wp_mail($to, $subject, $body, $headers);
        }

        return @mail($to, $subject, $body, $headers);
    }

    // ─── Public API для REST ──────────────────────────────────────────

    /**
     * Обработать отправку квиза (для REST / WordPress).
     * Не завершает скрипт, возвращает массив результата.
     *
     * @param array $input Поля: name, company, email, phone, answers (JSON string)
     * @return array ['success' => bool, 'error' => string|null]
     */
    public function processSubmission(array $input): array
    {
        $input['consent'] = 'on';
        $input['policy'] = 'on';

        if (!$this->validate($input)) {
            return [
                'success' => false,
                'error' => implode(' ', $this->errors),
            ];
        }

        if (!$this->sendEmail()) {
            return [
                'success' => false,
                'error' => 'Ошибка при отправке письма. Пожалуйста, попробуйте позже.',
            ];
        }

        return ['success' => true];
    }

    /**
     * Обработать запрос консультации (для REST / WordPress).
     *
     * @param array $contactData Поля: name, company, email, phone
     * @return array ['success' => bool, 'error' => string|null]
     */
    public function processConsultation(array $contactData): array
    {
        $sent = $this->sendConsultationRequest($contactData);
        if (!$sent) {
            return [
                'success' => false,
                'error' => 'Ошибка при отправке заявки. Пожалуйста, попробуйте позже.',
            ];
        }
        return ['success' => true];
    }

    // ─── JSON-ответ ─────────────────────────────────────────────────

    /**
     * Отдаёт JSON и завершает скрипт.
     *
     * @param bool        $success
     * @param string|array $message
     */
    private function jsonResponse(bool $success, $message): void
    {
        header('Content-Type: application/json; charset=UTF-8');
        header('X-Robots-Tag: noindex', true);

        $response = [
            'success' => $success,
            'message' => is_array($message) ? implode("\n", $message) : $message,
        ];

        if (is_array($message)) {
            $response['errors'] = $message;
        }

        echo json_encode($response, JSON_UNESCAPED_UNICODE);
        exit;
    }

    // ─── Логирование ────────────────────────────────────────────────

    /**
     * Логирует ошибку в файл.
     *
     * @param string $message
     * @param string $trace
     */
    private function logError(string $message, string $trace = ''): void
    {
        $logDir = QUIZ_LOG_DIR;
        if (!is_dir($logDir)) {
            @mkdir($logDir, 0755, true);
        }

        $logFile = rtrim($logDir, '/\\') . '/' . QUIZ_LOG_FILE;
        $timestamp = date('Y-m-d H:i:s');
        $entry = sprintf("[%s] %s\n", $timestamp, $message);
        if ($trace) {
            $entry .= "Trace:\n" . $trace . "\n";
        }
        $entry .= str_repeat('-', 80) . "\n";

        @file_put_contents($logFile, $entry, FILE_APPEND | LOCK_EX);
    }
}

endif; // class_exists
