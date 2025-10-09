let currentPage = 'landing';
let sidebarOpen = true;
let sessionId = null;
let chatMessages = [];
let chatHistoryItems = [];

// Navigation functions
function goToLogin() {
    document.getElementById('landing-page').classList.add('hidden');
    document.getElementById('login-page').classList.remove('hidden');
    currentPage = 'login';
}

function goToLanding() {
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('landing-page').classList.remove('hidden');
    currentPage = 'landing';
}

function goToChatbot() {
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('chatbot-page').classList.remove('hidden');
    currentPage = 'chatbot';
    initializeChatbot();
}

function logout() {
    if (confirm('Are you sure you want to sign out?')) {
        document.getElementById('chatbot-page').classList.add('hidden');
        document.getElementById('landing-page').classList.remove('hidden');
        currentPage = 'landing';
        resetChatbot();
    }
}

// Login handler
function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Store user info
    const userName = email.split('@')[0];
    const initials = userName.substring(0, 1).toUpperCase();
    
    document.getElementById('user-name').textContent = userName;
    document.getElementById('user-email').textContent = email;
    document.getElementById('user-initials').textContent = initials;
    
    goToChatbot();
}

// Sidebar toggle
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebarOpen = !sidebarOpen;
    
    if (sidebarOpen) {
        sidebar.style.transform = 'translateX(0)';
    } else {
        sidebar.style.transform = 'translateX(-100%)';
    }
}

// Initialize chatbot
function initializeChatbot() {
    sessionId = generateSessionId();
    loadChatHistory();
}

// Generate session ID
function generateSessionId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// New chat
function newChat() {
    if (chatMessages.length > 0) {
        saveChatToHistory();
    }
    
    chatMessages = [];
    sessionId = generateSessionId();
    
    const messagesContainer = document.getElementById('chat-messages');
    messagesContainer.innerHTML = `
        <div class="text-center text-gray-500 py-12">
            <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
            <p class="text-lg font-medium">Start a conversation</p>
            <p class="text-sm mt-2">Type a message below to begin chatting</p>
        </div>
    `;
}

// Save chat to history
function saveChatToHistory() {
    if (chatMessages.length > 0) {
        const firstMessage = chatMessages[0].text.substring(0, 30) + (chatMessages[0].text.length > 30 ? '...' : '');
        chatHistoryItems.unshift({
            id: sessionId,
            title: firstMessage,
            timestamp: new Date().toLocaleString()
        });
        loadChatHistory();
    }
}

// Load chat history
function loadChatHistory() {
    const historyContainer = document.getElementById('chat-history');
    
    if (chatHistoryItems.length === 0) {
        historyContainer.innerHTML = '<p class="text-sm text-gray-400 px-2">No recent chats</p>';
        return;
    }
    
    historyContainer.innerHTML = chatHistoryItems.map(item => `
        <div class="p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition">
            <p class="text-sm font-medium text-gray-800 truncate">${item.title}</p>
            <p class="text-xs text-gray-500 mt-1">${item.timestamp}</p>
        </div>
    `).join('');
}

// Send message
function sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message
    addMessage(message, 'user');
    input.value = '';
    
    // Show generating message
    addGeneratingMessage();
    
    // Prepare request payload for backend
    const requestPayload = {
        session_id: sessionId,
        message: message,
        temperature: 0,
        stream: false
    };
    
    fetch('https://mars-multi-agent-research-system.vercel.app/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload)
    })
    .then(response => response.json())
    .then(data => {
        removeGeneratingMessage();
        // Expecting backend to return { reply: "..." } or similar
        if (data && data.reply) {
            addMessage(data.reply, 'bot');
        } else {
            addMessage('Sorry, I did not get a valid response from the server.', 'bot');
        }
    })
    .catch(error => {
        removeGeneratingMessage();
        addMessage('Error connecting to server. Please try again later.', 'bot');
        console.error('Backend error:', error);
    });
}

// Handle Enter key
function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Add message to chat
function addMessage(text, sender) {
    const messagesContainer = document.getElementById('chat-messages');
    
    // Remove welcome message if present
    if (messagesContainer.querySelector('.text-center')) {
        messagesContainer.innerHTML = '';
    }
    
    chatMessages.push({ text, sender });
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start'} message-bubble`;
    
    if (sender === 'user') {
        messageDiv.innerHTML = `
            <div class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3 rounded-2xl max-w-md shadow-md">
                <p class="text-sm leading-relaxed">${escapeHtml(text)}</p>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="bg-white px-5 py-3 rounded-2xl max-w-md shadow-md border border-gray-200">
                <p class="text-sm text-gray-800 leading-relaxed">${escapeHtml(text)}</p>
            </div>
        `;
    }
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Add generating message
function addGeneratingMessage() {
    const messagesContainer = document.getElementById('chat-messages');
    
    const generatingDiv = document.createElement('div');
    generatingDiv.id = 'generating-message';
    generatingDiv.className = 'flex justify-start message-bubble';
    generatingDiv.innerHTML = `
        <div class="bg-white px-5 py-3 rounded-2xl shadow-md border border-gray-200">
            <p class="text-sm text-gray-600 generating-dots">Generating</p>
        </div>
    `;
    
    messagesContainer.appendChild(generatingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Remove generating message
function removeGeneratingMessage() {
    const generatingMsg = document.getElementById('generating-message');
    if (generatingMsg) {
        generatingMsg.remove();
    }
}

// Simulate bot response (for demo purposes)
function simulateBotResponse(userMessage) {
    const responses = [
        "That's an interesting question! Based on the information available, I can help you with that.",
        "I understand what you're asking. Let me provide you with a comprehensive answer.",
        "Great question! Here's what I can tell you about that topic.",
        "I've processed your request and here's the information you need.",
        "Thanks for your message! I'm here to help you with that inquiry."
    ];
    
    const response = responses[Math.floor(Math.random() * responses.length)];
    
    // Simulate backend response format
    const backendResponse = {
        session_id: sessionId,
        reply: response
    };
    
    console.log('Backend response format:', backendResponse);
    
    addMessage(backendResponse.reply, 'bot');
}

// Reset chatbot
function resetChatbot() {
    chatMessages = [];
    chatHistoryItems = [];
    sessionId = null;
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Responsive sidebar handling
window.addEventListener('resize', () => {
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth >= 1024) {
        sidebar.style.transform = 'translateX(0)';
        sidebarOpen = true;
    } else {
        if (!sidebarOpen) {
            sidebar.style.transform = 'translateX(-100%)';
        }
    }
});

// Initialize on mobile
if (window.innerWidth < 1024) {
    const sidebar = document.getElementById('sidebar');
    sidebar.style.transform = 'translateX(-100%)';
    sidebarOpen = false;
}