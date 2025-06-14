class MusicApp {
    constructor() {
        this.currentInstrument = 'drum';
        this.audioContext = null;
        this.sounds = {};
        this.isAudioInitialized = false;
        
        this.initializeApp();
    }
    
    async initializeApp() {
        this.setupEventListeners();
        this.setupAudioContext();
        await this.preloadSounds();
    }
    
    setupAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('Web Audio API not supported, using fallback');
        }
    }
    
    async preloadSounds() {
        const soundConfig = {
            'drum': { frequency: 80, type: 'sine', duration: 0.3 },
            'piano-a': { frequency: 220.00, type: 'triangle', duration: 0.5 },
            'piano-b': { frequency: 246.94, type: 'triangle', duration: 0.5 },
            'piano-c': { frequency: 261.63, type: 'triangle', duration: 0.5 },
            'piano-d': { frequency: 293.66, type: 'triangle', duration: 0.5 },
            'piano-e': { frequency: 329.63, type: 'triangle', duration: 0.5 },
            'piano-f': { frequency: 349.23, type: 'triangle', duration: 0.5 },
            'piano-g': { frequency: 392.00, type: 'triangle', duration: 0.5 },
            'maracas': { frequency: 2000, type: 'sawtooth', duration: 0.2 },
            'triangle': { frequency: 800, type: 'sine', duration: 1.0 },
            'xylo-a': { frequency: 440.00, type: 'square', duration: 0.6 },
            'xylo-b': { frequency: 493.88, type: 'square', duration: 0.6 },
            'xylo-c': { frequency: 523.25, type: 'square', duration: 0.6 },
            'xylo-d': { frequency: 587.33, type: 'square', duration: 0.6 },
            'xylo-e': { frequency: 659.25, type: 'square', duration: 0.6 },
            'xylo-f': { frequency: 698.46, type: 'square', duration: 0.6 },
            'xylo-g': { frequency: 783.99, type: 'square', duration: 0.6 }
        };
        
        for (const [soundName, config] of Object.entries(soundConfig)) {
            this.sounds[soundName] = config;
        }
    }
    
    setupEventListeners() {
        document.addEventListener('touchstart', this.enableAudio.bind(this), { once: true });
        document.addEventListener('click', this.enableAudio.bind(this), { once: true });
        
        document.querySelectorAll('[data-sound]').forEach(element => {
            element.addEventListener('touchstart', this.handleInstrumentPlay.bind(this));
            element.addEventListener('click', this.handleInstrumentPlay.bind(this));
        });
        
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('touchstart', this.handleTabClick.bind(this));
            button.addEventListener('click', this.handleTabClick.bind(this));
        });
    }
    
    async enableAudio() {
        if (!this.isAudioInitialized && this.audioContext) {
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            this.isAudioInitialized = true;
        }
    }
    
    handleInstrumentPlay(event) {
        event.preventDefault();
        const element = event.target.closest('[data-sound]');
        if (!element) return;
        
        const soundName = element.getAttribute('data-sound');
        this.playSound(soundName);
        this.addVisualFeedback(element);
    }
    
    playSound(soundName) {
        if (!this.audioContext || !this.isAudioInitialized) {
            console.warn('Audio not initialized');
            return;
        }
        
        const soundConfig = this.sounds[soundName];
        if (!soundConfig) return;
        
        try {
            this.synthesizeSound(soundConfig);
        } catch (error) {
            console.error('Error playing sound:', error);
        }
    }
    
    synthesizeSound(config) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = config.type;
        oscillator.frequency.setValueAtTime(config.frequency, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + config.duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + config.duration);
        
        if (config.type === 'sawtooth') {
            const noiseBuffer = this.createNoiseBuffer();
            const noiseSource = this.audioContext.createBufferSource();
            const noiseGain = this.audioContext.createGain();
            
            noiseSource.buffer = noiseBuffer;
            noiseSource.connect(noiseGain);
            noiseGain.connect(this.audioContext.destination);
            
            noiseGain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + config.duration);
            
            noiseSource.start(this.audioContext.currentTime);
            noiseSource.stop(this.audioContext.currentTime + config.duration);
        }
    }
    
    createNoiseBuffer() {
        const bufferSize = this.audioContext.sampleRate * 0.1;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        return buffer;
    }
    
    addVisualFeedback(element) {
        element.classList.add('playing', 'glow');
        
        setTimeout(() => {
            element.classList.remove('playing', 'glow');
        }, 300);
    }
    
    handleTabClick(event) {
        event.preventDefault();
        const button = event.target.closest('.tab-button');
        if (!button) return;
        
        const instrumentName = button.getAttribute('data-instrument');
        this.switchInstrument(instrumentName);
        
        this.addVisualFeedback(button);
    }
    
    switchInstrument(instrumentName) {
        document.querySelectorAll('.instrument').forEach(instrument => {
            instrument.classList.remove('active');
        });
        
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });
        
        const targetInstrument = document.getElementById(instrumentName);
        const targetButton = document.querySelector(`[data-instrument="${instrumentName}"]`);
        
        if (targetInstrument && targetButton) {
            targetInstrument.classList.add('active');
            targetButton.classList.add('active');
            this.currentInstrument = instrumentName;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MusicApp();
});

document.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });