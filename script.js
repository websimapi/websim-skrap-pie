// Initialize WebsimSocket at global scope
const room = new WebsimSocket();

class PieExperience {
    constructor() {
        this.conversationHistory = [];
        this.pieGallerySubscription = null; // For managing gallery updates
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

        // Navigation buttons functionality
        document.querySelectorAll('.nav-pie').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const flavor = e.target.dataset.flavor;
                this.handleNavigation(flavor);
            });
        });

        // Hero section buttons functionality
        document.querySelectorAll('.mega-pie').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const flavor = e.target.dataset.flavor;
                this.handleHeroButton(flavor);
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
        const flavors = ['apple', 'cherry', 'pumpkin', 'blueberry', 'pecan', 'chocolate'];
        const pieItemElements = document.querySelectorAll('.pie-showcase .pie-item');
        
        // Check if assets are already applied (e.g. from CSS)
        // If not, generate them. This is a fallback/enhancement.
        // The current setup uses CSS background images, so this LLM generation might be overriding them.
        // For this iteration, we'll keep the existing logic to generate images, assuming it's desired.
        
        for (const flavor of flavors) {
            const pieItem = document.querySelector(`.pie-item[data-flavor="${flavor}"]`);
            if (pieItem && (!pieItem.style.backgroundImage || pieItem.style.backgroundImage === 'none')) {
                 await this.generatePieImage(flavor); // Only generate if not set by CSS.
            }
        }
    }

    async generatePieImage(flavor) {
        try {
            const result = await websim.imageGen({
                prompt: `A delicious ${flavor} pie, top-down view, golden crust, realistic food photography, mouth-watering, professional bakery quality`,
                transparent: true,
                aspect_ratio: "1:1"
            });

            const pieItem = document.querySelector(`.pie-item[data-flavor="${flavor}"]`);
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
                transparent: false, // Keep as false for main display
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

            messages.innerHTML += `<div style="margin: 0.5rem 0; padding: 0.5rem; background: rgba(139,69,19,0.2); border-radius: 10px;"><strong>You:</strong> ${message}</div>`;
            input.value = '';
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
                <button class="pie-btn small-pie" id="close-pie-explanation-btn">Close</button>
            `;
            document.getElementById('close-pie-explanation-btn').addEventListener('click', () => {
                container.innerHTML = '';
            });
        } catch (error) {
            container.innerHTML = '<p>The pie knowledge oven is cooling down. Try again!</p>';
        }
    }

    async handleNavigation(flavor) {
        const container = document.querySelector('.generated-pie-container');
        switch(flavor) {
            case 'apple':
                container.innerHTML = `
                    <h3>🥧 Welcome to Pie World Home! 🥧</h3>
                    <p>You are now in the ultimate pie headquarters! Everything here is made of delicious, flaky pie crust!</p>
                    <img src="/apple-pie.png" alt="Home Pie" style="width: 200px; height: 200px; border-radius: 50%; margin: 1rem;">
                `;
                break;
            case 'cherry':
                container.innerHTML = `
                    <h3>🥧 About Our Pie Universe 🥧</h3>
                    <p>This website was built entirely out of pie! Every pixel, every button, every letter - all made from the finest pie ingredients. We are the world's first 100% edible website!</p>
                    <img src="/cherry-pie.png" alt="About Pie" style="width: 200px; height: 200px; border-radius: 50%; margin: 1rem;">
                `;
                break;
            case 'pumpkin':
                container.innerHTML = `
                    <h3>🥧 Contact the Pie Masters 🥧</h3>
                    <p>Send us a message through pie telepathy! Or use our pie chat feature above. We're always baking up new pie experiences!</p>
                    <img src="/pumpkin-pie.png" alt="Contact Pie" style="width: 200px; height: 200px; border-radius: 50%; margin: 1rem;">
                    <p>📧 Email: piemaster@pieworld.pie<br>📞 Phone: 1-800-PIE-TIME</p>
                `;
                break;
        }
    }

    async handleHeroButton(flavor) {
        switch(flavor) {
            case 'blueberry':
                await this.generateRandomPie();
                break;
            case 'pecan':
                await this.showPieGallery();
                break;
            case 'chocolate':
                await this.startPieChat();
                break;
        }
    }

    async showPieGallery() {
        const container = document.querySelector('.generated-pie-container');
        container.innerHTML = '<div class="loading">🥧 Loading pie gallery... 🥧</div>';
    
        const renderGallery = async (pies) => {
            const currentUser = await window.websim.getCurrentUser();
            
            let galleryHTML = `
                <h3>🥧 PIE GALLERY - COMMUNITY COLLECTION 🥧</h3>
                <div style="margin: 1rem 0;">
                    <button class="pie-btn small-pie" id="add-pie-btn">Add Your Pie</button>
                </div>
                <div class="pie-gallery-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 2rem 0;">
            `;
    
            if (pies.length === 0) {
                galleryHTML += '<p style="grid-column: 1 / -1; text-align: center; font-size: 1.2rem;">No pies in the gallery yet! Be the first to add one! 🥧</p>';
            } else {
                // pies are already newest to oldest from getList() / subscribe()
                for (const pie of pies) {
                    const isOwner = pie.username === currentUser.username;
                    galleryHTML += `
                        <div class="pie-gallery-item" style="text-align: center; background: rgba(255,255,255,0.1); padding: 1rem; border-radius: 15px; backdrop-filter: blur(5px);">
                            <img src="${pie.image_url}" alt="${pie.name}" style="width: 150px; height: 150px; border-radius: 50%; box-shadow: 0 5px 15px rgba(0,0,0,0.3); margin-bottom: 0.5rem; object-fit: cover;">
                            <h4 style="font-size: 1rem; margin-bottom: 0.5rem;">${pie.name.toUpperCase()}</h4>
                            <p style="font-size: 0.8rem; margin-bottom: 0.5rem;">${pie.description}</p>
                            <p style="font-size: 0.7rem; opacity: 0.8;">by ${pie.username}</p>
                            ${isOwner ? `<button class="pie-btn delete-pie-btn" data-pie-id="${pie.id}" style="width: 40px; height: 40px; margin-top: 0.5rem; font-size: 0.8rem;">🗑️</button>` : ''}
                        </div>
                    `;
                }
            }
    
            galleryHTML += '</div><button class="pie-btn small-pie" id="close-gallery-btn">Close Gallery</button>';
            container.innerHTML = galleryHTML;
    
            document.getElementById('add-pie-btn')?.addEventListener('click', () => {
                this.showAddPieForm();
            });
    
            document.getElementById('close-gallery-btn')?.addEventListener('click', () => {
                container.innerHTML = '';
                if (this.pieGallerySubscription) { // Unsubscribe when gallery is closed
                    this.pieGallerySubscription();
                    this.pieGallerySubscription = null;
                }
            });
    
            container.querySelectorAll('.delete-pie-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const pieId = event.currentTarget.dataset.pieId;
                    this.deletePie(pieId);
                });
            });
        };
    
        if (this.pieGallerySubscription) {
            this.pieGallerySubscription(); // Unsubscribe from previous if any
        }
    
        this.pieGallerySubscription = room.collection('pie').subscribe(async (piesFromDb) => {
            // Check if the gallery section is still supposed to be active
            if (container.querySelector('.pie-gallery-grid') || container.querySelector('.loading')) {
                 await renderGallery(piesFromDb);
            } else if (container.innerHTML.includes("Loading pie gallery...")) { // If it was just opened
                await renderGallery(piesFromDb);
            }
        });
    }

    async showAddPieForm() {
        const container = document.querySelector('.generated-pie-container');
        // Unsubscribe from gallery updates while add form is open
        if (this.pieGallerySubscription) {
            this.pieGallerySubscription();
            this.pieGallerySubscription = null;
        }

        container.innerHTML = `
            <h3>🥧 ADD YOUR PIE TO THE GALLERY 🥧</h3>
            <div style="background: rgba(255,255,255,0.2); padding: 2rem; border-radius: 15px; backdrop-filter: blur(10px);">
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">Pie Name:</label>
                    <input type="text" id="pie-name" placeholder="My Amazing Apple Pie" style="width: 100%; padding: 0.5rem; border-radius: 10px; border: none; font-size: 1rem;">
                </div>
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">Description:</label>
                    <textarea id="pie-description" placeholder="A delicious homemade apple pie with..." style="width: 100%; padding: 0.5rem; border-radius: 10px; border: none; font-size: 1rem; height: 80px; resize: vertical;"></textarea>
                </div>
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">Generate Pie Image:</label>
                    <button class="pie-btn small-pie" id="generate-pie-image-form">🥧 Generate</button>
                    <span style="margin-left: 1rem; font-size: 0.9rem;">Or upload your own image:</span>
                    <input type="file" id="pie-image-upload" accept="image/*" style="margin-left: 0.5rem;">
                </div>
                <div id="pie-preview" style="margin-bottom: 1rem; text-align: center;"></div>
                <div style="text-align: center; gap: 1rem; display: flex; justify-content: center;">
                    <button class="pie-btn small-pie" id="save-pie-btn" disabled>Save Pie</button>
                    <button class="pie-btn small-pie" id="cancel-add-pie-form-btn">Cancel</button>
                </div>
            </div>
        `;

        let pieImageUrl = '';

        document.getElementById('generate-pie-image-form').addEventListener('click', async () => {
            const name = document.getElementById('pie-name').value.trim();
            const description = document.getElementById('pie-description').value.trim();
            if (!name) { alert('Please enter a pie name first!'); return; }
            const preview = document.getElementById('pie-preview');
            preview.innerHTML = '<div class="loading">🥧 Generating your pie... 🥧</div>';
            try {
                const result = await websim.imageGen({
                    prompt: `A beautiful ${name}, ${description || 'delicious pie'}, professional food photography, artisanal bakery style, golden flaky crust, detailed texture`,
                    transparent: false, aspect_ratio: "1:1"
                });
                pieImageUrl = result.url;
                preview.innerHTML = `<img src="${result.url}" alt="${name}" style="width: 200px; height: 200px; border-radius: 50%; box-shadow: 0 5px 15px rgba(0,0,0,0.3);">`;
                document.getElementById('save-pie-btn').disabled = false;
            } catch (error) {
                preview.innerHTML = '<p style="color: red;">Error generating pie image. Try again!</p>';
            }
        });

        document.getElementById('pie-image-upload').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const preview = document.getElementById('pie-preview');
            preview.innerHTML = '<div class="loading">🥧 Uploading your pie... 🥧</div>';
            try {
                pieImageUrl = await websim.upload(file);
                preview.innerHTML = `<img src="${pieImageUrl}" alt="Uploaded pie" style="width: 200px; height: 200px; border-radius: 50%; box-shadow: 0 5px 15px rgba(0,0,0,0.3); object-fit: cover;">`;
                document.getElementById('save-pie-btn').disabled = false;
            } catch (error) {
                preview.innerHTML = '<p style="color: red;">Error uploading image. Try again!</p>';
            }
        });

        document.getElementById('save-pie-btn').addEventListener('click', async () => {
            const name = document.getElementById('pie-name').value.trim();
            const description = document.getElementById('pie-description').value.trim();
            if (!name || !description || !pieImageUrl) {
                alert('Please fill in all fields and add an image!');
                return;
            }
            try {
                await room.collection('pie').create({
                    name: name, description: description, image_url: pieImageUrl,
                    flavor: name.toLowerCase().replace(/\s+/g, '-') // create a flavor tag
                });
                alert('🥧 Your pie has been added to the gallery! 🥧');
                this.showPieGallery(); // Go back to gallery, which will re-subscribe
            } catch (error) {
                alert('Error saving pie. Please try again!');
                console.error('Error saving pie:', error);
            }
        });

        document.getElementById('cancel-add-pie-form-btn').addEventListener('click', () => {
            this.showPieGallery(); // Go back to gallery, which will re-subscribe
        });
    }

    async deletePie(pieId) {
        if (confirm('Are you sure you want to remove this pie from the gallery?')) {
            try {
                await room.collection('pie').delete(pieId);
                // The gallery will auto-update due to the subscription.
                // No need to call this.showPieGallery() explicitly if subscription is active.
                // However, showPieGallery() itself manages subscription, so calling it ensures consistency.
                // If gallery is not visible, it means subscription was cleared.
                // If current view IS gallery, subscription will handle it. Let's remove explicit refresh.
                // The subscription in showPieGallery should handle the re-render.
            } catch (error) {
                alert('Error deleting pie. You can only delete your own pies!');
                console.error('Error deleting pie:', error);
            }
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

// Initialize the pie experience and store reference globally
document.addEventListener('DOMContentLoaded', () => {
    window.pieExperienceInstance = new PieExperience();
});