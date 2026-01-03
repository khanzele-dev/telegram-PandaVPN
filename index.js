const sendMessage = async () => {
  const token = '8527544760:AAFZs0MB86oF4OIsLgjDgVwcbTVCSBGrerc';
  const chatId = '';
  const text = 'Test Message';

  const url = `https://api.telegram.org/bot${token}/getMe`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      }),
    });

    const data = await response.json();

    if (data.ok) {
      console.log('Сообщение успешно отправлено:', data.result.message_id);
    } else {
      console.error('Ошибка от Telegram:', data.description);
    }
  } catch (error) {
    console.error('Ошибка при выполнении запроса:', error);
  }
};

sendMessage();
