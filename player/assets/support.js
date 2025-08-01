// Tab functionality for chat & top gifter
const tabChatBtn = document.getElementById('tabChatBtn');
const tabTopGifterBtn = document.getElementById('tabTopGifterBtn');
const tabChat = document.getElementById('tabChat');
const tabTopGifter = document.getElementById('tabTopGifter');
const chatForms = document.getElementById('chatForm');
tabChatBtn.addEventListener('click', () => selectTab('chat'));
tabTopGifterBtn.addEventListener('click', () => selectTab('topgifter'));

function selectTab(tab) {
	if (tab === 'chat') {
		tabChatBtn.setAttribute('aria-selected', 'true');
		tabChatBtn.tabIndex = 0;
		tabTopGifterBtn.setAttribute('aria-selected', 'false');
		tabTopGifterBtn.tabIndex = -1;
		tabChat.classList.remove('hidden');
		tabTopGifter.classList.add('hidden');
		chatForms.classList.remove('hidden');
		// pindahkan border & warna
		tabChatBtn.classList.add('border-red-600', 'text-white');
		tabChatBtn.classList.remove('border-transparent', 'text-gray-400');
		tabTopGifterBtn.classList.remove('border-red-600', 'text-white');
		tabTopGifterBtn.classList.add('border-transparent', 'text-gray-400');
	} else {
		//chatForm
		tabTopGifterBtn.setAttribute('aria-selected', 'true');
		tabTopGifterBtn.tabIndex = 0;
		tabChatBtn.setAttribute('aria-selected', 'false');
		tabChatBtn.tabIndex = -1;
		tabTopGifter.classList.remove('hidden');
		tabChat.classList.add('hidden');
		chatForms.classList.add('hidden');
		// pindahkan border & warna
		tabTopGifterBtn.classList.add('border-red-600', 'text-white');
		tabTopGifterBtn.classList.remove('border-transparent', 'text-gray-400');
		tabChatBtn.classList.remove('border-red-600', 'text-white');
		tabChatBtn.classList.add('border-transparent', 'text-gray-400');
	}
}

function tampilkanChat(nama, pesan) {
    const chatBox = document.querySelector(".stream-chat");

    const chatContainer = document.createElement("div");
    chatContainer.className = "chat-message mb-2";

    const nameElement = document.createElement("div");
    nameElement.className = "font-bold text-yellow-400";
    nameElement.textContent = nama;

    const messageElement = document.createElement("div");
    //messageElement.className = "ml-1";
    messageElement.textContent = pesan;

    chatContainer.appendChild(nameElement);
    chatContainer.appendChild(messageElement);
    chatBox.appendChild(chatContainer);

    chatBox.scrollTop = chatBox.scrollHeight;
}

// Chat form submission
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
chatForm.addEventListener('submit', (e) => {
	e.preventDefault();
	if (chatInput.value.trim() !== '') {
		tampilkanChat("Kamu", chatInput.value)
		chatInput.value = '';
		chatInput.focus();
	}
});