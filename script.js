class PieExperience {
    constructor() {
        this.conversationHistory = [];
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupCustomCursor();
        await this.generateInitialPies();
    }

    setupEventListeners() {
        // Pie generation button
        document.getElementById('generate-pie').addEventListener('click', () => {
            this.generateRandomPie();
        });

        // Pie chat button
        document.getElementById('pie-chat').addEventListener('click', () => {
            this.startPieChat();
        });

        // Pie sound button
        document.getElementById('pie-sound').addEventListener('click', () => {
            this.playPieSound();
        });

        // All pie buttons get special effects
        document.querySelectorAll('.pie-btn').forEach(btn => {
            btn.addEventListener('mouseenter', this.pieHoverEffect);
            btn.addEventListener('mouseleave', this.pieLeaveEffect);
            btn.addEventListener('click', this.pieClickEffect);
        });

        // Pie items interaction
        document.querySelectorAll('.pie-item').forEach(item => {
            item.addEventListener('click', () => {
                this.explainPie(item.dataset.flavor);
            });
        });
    }

    setupCustomCursor() {
        const cursor = document.querySelector('.pie-cursor');
        
        document.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        });

        document.addEventListener('mousedown', () => {
            cursor.style.transform = 'scale(0.8) rotate(15deg)';
        });

        document.addEventListener('mouseup', () => {
            cursor.style.transform = 'scale(1) rotate(0deg)';
        });
    }

    async generateInitialPies() {
        // Generate pie images for all the pie items
        const flavors = ['apple', 'cherry', 'pumpkin', 'blueberry', 'pecan', 'chocolate'];
        
        for (const flavor of flavors) {
            await this.generatePieImage(flavor);
        }
    }

    async generatePieImage(flavor) {
        try {
            const result = await websim.imageGen({
                prompt: `A delicious ${flavor} pie, top-down view, golden crust, realistic food photography, mouth-watering, professional bakery quality`,
                transparent: true,
                aspect_ratio: "1:1"
            });

            // Update the pie item background
            const pieItem = document.querySelector(`[data-flavor="${flavor}"]`);
            if (pieItem) {
                pieItem.style.backgroundImage = `url(${result.url})`;
            }
        } catch (error) {
            console.error('Error generating pie image:', error);
        }
    }

    async generateRandomPie() {
        const container = document.querySelector('.generated-pie-container');
        container.innerHTML = '<div class="loading">🥧 Baking a fresh pie... 🥧</div>';

        const randomFlavors = [
            'strawberry rhubarb', 'key lime', 'lemon meringue', 'banana cream',
            'coconut cream', 'mud pie', 'shepherd\'s pie', 'pizza pie',
            'blackberry', 'raspberry', 'mixed berry', 'caramel apple'
        ];

        const randomFlavor = randomFlavors[Math.floor(Math.random() * randomFlavors.length)];

        try {
            const result = await websim.imageGen({
                prompt: `A beautiful ${randomFlavor} pie, artisanal bakery style, golden flaky crust, detailed texture, food photography`,
                transparent: false,
                aspect_ratio: "1:1"
            });

            container.innerHTML = `
                <h3>🥧 Fresh ${randomFlavor.toUpperCase()} Pie! 🥧</h3>
                <img src="${result.url}" alt="${randomFlavor} pie" style="width: 300px; height: 300px; border-radius: 50%; margin: 1rem; box-shadow: 0 10px 20px rgba(0,0,0,0.3);">
                <p>Freshly baked and ready to enjoy!</p>
            `;
        } catch (error) {
            container.innerHTML = '<p>Oops! The pie oven is having issues. Try again!</p>';
        }
    }

    async startPieChat() {
        const container = document.querySelector('.generated-pie-container');
        
        container.innerHTML = `
            <h3>🥧 Chat with the Pie Master! 🥧</h3>
            <div class="pie-chat-container">
                <div class="pie-messages" style="max-height: 300px; overflow-y: auto; background: rgba(255,255,255,0.2); padding: 1rem; border-radius: 15px; margin: 1rem 0;"></div>
                <div class="pie-input-container" style="display: flex; gap: 1rem;">
                    <input type="text" id="pie-chat-input" placeholder="Ask me anything about pies!" style="flex: 1; padding: 0.5rem; border-radius: 25px; border: none; font-size: 1rem;">
                    <button id="send-pie-message" class="pie-btn small-pie" style="width: 60px; height: 60px;">Send</button>
                </div>
            </div>
        `;

        const input = document.getElementById('pie-chat-input');
        const sendBtn = document.getElementById('send-pie-message');
        const messages = document.querySelector('.pie-messages');

        const sendMessage = async () => {
            const message = input.value.trim();
            if (!message) return;

            // Add user message
            messages.innerHTML += `<div style="margin: 0.5rem 0; padding: 0.5rem; background: rgba(139,69,19,0.2); border-radius: 10px;"><strong>You:</strong> ${message}</div>`;
            input.value = '';

            // Add to conversation history
            this.conversationHistory.push({ role: "user", content: message });

            try {
                const completion = await websim.chat.completions.create({
                    messages: [
                        {
                            role: "system",
                            content: "You are the Pie Master, an enthusiastic expert on all things pie! You speak with passion about pies, always relate everything back to pies, and use pie emojis. You're friendly, knowledgeable, and slightly obsessed with pies."
                        },
                        ...this.conversationHistory.slice(-10)
                    ]
                });

                const response = completion.content;
                this.conversationHistory.push(completion);

                // Add AI response
                messages.innerHTML += `<div style="margin: 0.5rem 0; padding: 0.5rem; background: rgba(210,105,30,0.2); border-radius: 10px;"><strong>Pie Master:</strong> ${response}</div>`;
                messages.scrollTop = messages.scrollHeight;
            } catch (error) {
                messages.innerHTML += `<div style="margin: 0.5rem 0; padding: 0.5rem; background: rgba(255,0,0,0.2); border-radius: 10px;"><strong>Error:</strong> The Pie Master is busy baking! Try again.</div>`;
            }
        };

        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    async playPieSound() {
        try {
            const result = await websim.textToSpeech({
                text: "Welcome to the most delicious pie experience! Everything is pie, and pie is everything! Mmm, so tasty!",
                voice: "en-female"
            });

            const audio = new Audio(result.url);
            audio.play();
        } catch (error) {
            console.error('Error playing pie sound:', error);
        }
    }

    async explainPie(flavor) {
        const container = document.querySelector('.generated-pie-container');
        container.innerHTML = '<div class="loading">🥧 Learning about pie... 🥧</div>';

        try {
            const completion = await websim.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "You are a pie enthusiast. Describe the given pie flavor in 2-3 sentences with passion and detail. Include interesting facts and make it mouth-watering!"
                    },
                    {
                        role: "user",
                        content: `Tell me about ${flavor} pie`
                    }
                ]
            });

            container.innerHTML = `
                <h3>🥧 ${flavor.toUpperCase()} PIE FACTS 🥧</h3>
                <p style="font-size: 1.2rem; line-height: 1.6; margin: 1rem 0;">${completion.content}</p>
                <button class="pie-btn small-pie" onclick="this.parentElement.innerHTML = ''">Close</button>
            `;
        } catch (error) {
            container.innerHTML = '<p>The pie knowledge oven is cooling down. Try again!</p>';
        }
    }

    pieHoverEffect(e) {
        e.target.style.transform = 'scale(1.1) rotate(5deg)';
        e.target.style.filter = 'brightness(1.2) saturate(1.3) drop-shadow(0 10px 20px rgba(0,0,0,0.3))';
    }

    pieLeaveEffect(e) {
        e.target.style.transform = 'scale(1) rotate(0deg)';
        e.target.style.filter = 'brightness(1) saturate(1) drop-shadow(none)';
    }

    pieClickEffect(e) {
        e.target.style.transform = 'scale(0.95) rotate(-5deg)';
        setTimeout(() => {
            e.target.style.transform = 'scale(1.05) rotate(2deg)';
            setTimeout(() => {
                e.target.style.transform = 'scale(1) rotate(0deg)';
            }, 150);
        }, 100);
    }
}

// Initialize the pie experience
document.addEventListener('DOMContentLoaded', () => {
    new PieExperience();
});

