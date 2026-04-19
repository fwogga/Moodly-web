<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Moodly</title>
    <link rel="stylesheet" href="Chat.css">
</head>
<body>
    <div class="body">

        <!--Barra Lateral do menu principal-->

        <div class="chat-sidebar">
            <h2>Moodly</h2>
            <ul>
                <li>Eventos</li>
                <li>Descobrir</li>
                <li>Mensagens</li>
                <li>Perfil</li>
            </ul>
        </div>

        <!-- Lista de mensagens-->

        <div class="chat-list">
            <h3>Mensagens</h3>
            <input type="text" placeholder="Pesquisar...">

            <div class="chat-item">
                <p><strong>Ana Silva</strong></p>
                <p>Quando nos encontramos?</p>
            </div>

            <div class="chat-item">
                <p><strong>Ricardo Lopes</strong></p>
                <p>Adoro o mesmo artista!!</p>
            </div>
        </div>

        <!--Área de mensagens-->

        <div class="chat-area">

            <div class="chat-header">
                <h3>Ana Silva</h3>
                <p>Online agora</p>
            </div>

            <div class="message received">
                <p>Olá! Vi que temos gostos muito parecidos</p>
            </div>

            <div class="message sent">
                <p>Sim! Também adoro Artic Monkeys! Foste ao último concerto?</p>
            </div>

            <!--Input da mensagem-->

            <div class="chat-input">
                <input type="text" placeholder="Escrever mensagem">
                <button>Enviar</button>
            </div>

        </div>

    </div>
</body>
</html>