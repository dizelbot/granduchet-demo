<?php
/**
 * Plugin Name:     Гранд Учет — Квиз «Цифровизация бизнеса»
 * Plugin URI:      https://granduchet.ru/
 * Description:     Интерактивный квиз для оценки уровня цифровизации бизнеса.
 *                  Шорткод: [digitalization_quiz]. AJAX-отправка через REST API.
 * Version:         1.0.0
 * Author:          Гранд Учет
 * Text Domain:     granduchet-quiz
 *
 * @package GrandUchet\Quiz
 */

if (!defined('ABSPATH')) {
    exit;
}

define('GRANDUCHET_QUIZ_VERSION', '1.0.0');
define('GRANDUCHET_QUIZ_DIR',     plugin_dir_path(__FILE__));
define('GRANDUCHET_QUIZ_URL',     plugin_dir_url(__FILE__));

/**
 * Получить email получателя заявок.
 */
function granduchet_quiz_get_recipient_email(): string
{
    $saved = get_option('granduchet_quiz_recipient_email', '');
    if (!empty($saved) && filter_var($saved, FILTER_VALIDATE_EMAIL)) {
        return $saved;
    }
    return 'email@granduchet.ru';
}

require_once GRANDUCHET_QUIZ_DIR . 'assets/quiz-handler.php';

if (!class_exists('GrandUchetQuizPlugin')) :

class GrandUchetQuizPlugin
{
    private static ?self $instance = null;
    private ?DigitalizationQuizHandler $handler = null;

    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct()
    {
        $this->handler = new DigitalizationQuizHandler();

        add_action('init', [$this, 'init']);
        add_shortcode('digitalization_quiz', [$this, 'renderShortcode']);
        add_action('rest_api_init', [$this, 'registerRestRoutes']);

        if (is_admin()) {
            add_action('admin_menu', [$this, 'addAdminMenu']);
            add_action('admin_init', [$this, 'registerSettings']);
        }
    }

    public function init(): void
    {
        load_plugin_textdomain('granduchet-quiz', false, dirname(plugin_basename(__FILE__)) . '/languages');
    }

    /**
     * Шорткод: [digitalization_quiz]
     * Вставляет HTML-шаблон из quiz.html и подключает CSS/JS.
     */
    public function renderShortcode(array $atts = [], string $content = ''): string
    {
        wp_enqueue_style('granduchet-quiz', GRANDUCHET_QUIZ_URL . 'assets/quiz.css', [], GRANDUCHET_QUIZ_VERSION);
        wp_enqueue_script('granduchet-quiz', GRANDUCHET_QUIZ_URL . 'assets/quiz.js', [], GRANDUCHET_QUIZ_VERSION, true);

        // Передаём AJAX URL и сообщения в JS
        wp_add_inline_script('granduchet-quiz', 'window.granduchetQuiz = ' . wp_json_encode([
            'ajaxUrl' => rest_url('granduchet-quiz/v1/submit'),
            'consultUrl' => rest_url('granduchet-quiz/v1/consultation'),
            'nonce'   => wp_create_nonce('wp_rest'),
        ]), 'before');

        // Загружаем HTML-шаблон из assets/quiz.html
        $template_path = GRANDUCHET_QUIZ_DIR . 'assets/quiz.html';
        if (file_exists($template_path)) {
            $html = file_get_contents($template_path);
            // Заменяем PHP-теги путей на WordPress-функции
            $html = str_replace(
                '<?php echo get_template_directory_uri(); ?>',
                esc_url(GRANDUCHET_QUIZ_URL),
                $html
            );
            return $html;
        }

        // fallback
        return '<p>Ошибка: файл шаблона квиза не найден.</p>';
    }

    // ─── REST API ────────────────────────────────────────────────

    public function registerRestRoutes(): void
    {
        register_rest_route('granduchet-quiz/v1', '/submit', [
            'methods'             => 'POST',
            'callback'            => [$this, 'handleSubmit'],
            'permission_callback' => '__return_true',
            'args'                => $this->getRestArgs(),
        ]);

        register_rest_route('granduchet-quiz/v1', '/consultation', [
            'methods'             => 'POST',
            'callback'            => [$this, 'handleConsultation'],
            'permission_callback' => '__return_true',
            'args'                => $this->getRestArgs(),
        ]);
    }

    private function getRestArgs(): array
    {
        return [
            'name'    => [
                'required'          => true,
                'sanitize_callback' => 'sanitize_text_field',
                'validate_callback' => function ($v) {
                    return is_string($v) && mb_strlen(trim($v)) > 0 && mb_strlen($v) <= 150;
                },
            ],
            'company' => [
                'required'          => true,
                'sanitize_callback' => 'sanitize_text_field',
                'validate_callback' => function ($v) {
                    return is_string($v) && mb_strlen(trim($v)) > 0 && mb_strlen($v) <= 250;
                },
            ],
            'email'   => [
                'required'          => true,
                'sanitize_callback' => 'sanitize_email',
                'validate_callback' => function ($v) {
                    return is_string($v) && filter_var($v, FILTER_VALIDATE_EMAIL);
                },
            ],
            'phone'   => [
                'required'          => true,
                'sanitize_callback' => function ($v) {
                    return preg_replace('/[^\d+]/', '', $v);
                },
                'validate_callback' => function ($v) {
                    $clean = preg_replace('/[^\d+]/', '', $v);
                    return (bool) preg_match('/^\+?7\d{10}$/', $clean);
                },
            ],
            'consent' => [
                'required'          => true,
                'sanitize_callback' => 'rest_sanitize_boolean',
            ],
            'policy'  => [
                'required'          => true,
                'sanitize_callback' => 'rest_sanitize_boolean',
            ],
            'answers' => [
                'required'          => false,
                'sanitize_callback' => function ($v) {
                    if (!is_array($v)) return [];
                    $sanitized = [];
                    foreach ($v as $qId => $answer) {
                        $sanitized[sanitize_text_field($qId)] = sanitize_text_field((string) $answer);
                    }
                    return $sanitized;
                },
            ],
        ];
    }

    public function handleSubmit(WP_REST_Request $request): WP_REST_Response
    {
        $data = [
            'name'    => $request->get_param('name'),
            'company' => $request->get_param('company'),
            'email'   => $request->get_param('email'),
            'phone'   => $request->get_param('phone'),
            'answers' => $request->get_param('answers') ?: [],
            'consent' => $request->get_param('consent'),
            'policy'  => $request->get_param('policy'),
        ];

        // Проверяем чекбоксы
        if (!$data['consent'] || !$data['policy']) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Необходимо согласие на обработку персональных данных.',
            ], 422);
        }

        $result = $this->handler->processSubmission([
            'name'    => $data['name'],
            'company' => $data['company'],
            'email'   => $data['email'],
            'phone'   => $data['phone'],
            'answers' => json_encode($data['answers'], JSON_UNESCAPED_UNICODE),
        ]);

        if ($result['success']) {
            $this->fireYandexMetricaGoal();
            return new WP_REST_Response([
                'success' => true,
                'message' => 'Благодарим Вас за участие в опросе! В ближайшее время наш эксперт пришлет подробный отчет с рекомендациями на указанную почту.',
            ], 200);
        }

        return new WP_REST_Response([
            'success' => false,
            'message' => $result['error'] ?? 'Ошибка отправки. Попробуйте позже.',
        ], 500);
    }

    public function handleConsultation(WP_REST_Request $request): WP_REST_Response
    {
        $data = [
            'name'    => $request->get_param('name'),
            'company' => $request->get_param('company'),
            'email'   => $request->get_param('email'),
            'phone'   => $request->get_param('phone'),
        ];

        $result = $this->handler->processConsultation($data);

        if ($result['success']) {
            return new WP_REST_Response([
                'success' => true,
                'message' => 'Заявка на консультацию отправлена! Мы свяжемся с вами в ближайшее время.',
            ], 200);
        }

        return new WP_REST_Response([
            'success' => false,
            'message' => $result['error'] ?? 'Ошибка отправки.',
        ], 500);
    }

    /**
     * Отправка цели в Яндекс.Метрику через wp_footer.
     */
    private function fireYandexMetricaGoal(): void
    {
        add_action('wp_footer', function () {
            ?><script>try{if(typeof ym==='function')ym('reachGoal','quiz_submit')}catch(e){}</script><?php
        }, 999);
    }

    // ─── Админ-панель ─────────────────────────────────────────────

    public function addAdminMenu(): void
    {
        add_options_page(
            __('Квиз «Цифровизация бизнеса»', 'granduchet-quiz'),
            __('Гранд Учет — Квиз', 'granduchet-quiz'),
            'manage_options',
            'granduchet-quiz-settings',
            [$this, 'renderAdminPage']
        );
    }

    public function registerSettings(): void
    {
        register_setting('granduchet_quiz_settings', 'granduchet_quiz_recipient_email', [
            'type'              => 'string',
            'sanitize_callback' => 'sanitize_email',
            'default'           => 'email@granduchet.ru',
        ]);
    }

    public function renderAdminPage(): void
    {
        if (!current_user_can('manage_options')) {
            wp_die(__('Недостаточно прав.', 'granduchet-quiz'));
        }
        ?>
        <div class="wrap">
            <h1><?php _e('Настройки квиза «Цифровизация бизнеса»', 'granduchet-quiz'); ?></h1>
            <form method="post" action="options.php">
                <?php settings_fields('granduchet_quiz_settings'); ?>
                <table class="form-table">
                    <tr>
                        <th scope="row">
                            <label for="granduchet_quiz_recipient_email"><?php _e('Email для заявок', 'granduchet-quiz'); ?></label>
                        </th>
                        <td>
                            <input type="email"
                                   id="granduchet_quiz_recipient_email"
                                   name="granduchet_quiz_recipient_email"
                                   value="<?php echo esc_attr(get_option('granduchet_quiz_recipient_email', 'email@granduchet.ru')); ?>"
                                   class="regular-text" required>
                            <p class="description"><?php _e('На этот адрес будут приходить заявки из квиза.', 'granduchet-quiz'); ?></p>
                        </td>
                    </tr>
                </table>
                <?php submit_button(__('Сохранить', 'granduchet-quiz')); ?>
            </form>
            <hr>
            <h2><?php _e('Как использовать', 'granduchet-quiz'); ?></h2>
            <p><?php _e('Добавьте шорткод на любую страницу или в запись:', 'granduchet-quiz'); ?></p>
            <code>[digitalization_quiz]</code>
        </div>
        <?php
    }
}

endif;

GrandUchetQuizPlugin::getInstance();
