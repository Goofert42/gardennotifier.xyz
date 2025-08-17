// Mobile menu functionality - Updated version
document.addEventListener('DOMContentLoaded', function() {
    
    // Custom smooth scroll function
    function smoothScrollTo(targetY, duration = 800) {
        const startY = window.pageYOffset;
        const distance = targetY - startY;
        const startTime = performance.now();
        
        function easeInOutCubic(t) {
            return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
        }
        
        function animation(currentTime) {
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);
            const ease = easeInOutCubic(progress);
            
            window.scrollTo(0, startY + distance * ease);
            
            if (progress < 1) {
                requestAnimationFrame(animation);
            }
        }
        
        requestAnimationFrame(animation);
    }
    
    // Smooth scrolling for anchor links
    const anchors = document.querySelectorAll('a[href^="#"]');
    
    anchors.forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                // Get header height dynamically
                const header = document.querySelector('.header');
                const headerHeight = header ? header.offsetHeight : 80;
                
                // Calculate target position with offset
                const targetPosition = targetElement.offsetTop - headerHeight - 20;
                
                // Try multiple scroll methods for better compatibility
                try {
                    // Custom smooth scroll function
                    smoothScrollTo(Math.max(0, targetPosition), 800); // 800ms duration
                    
                } catch (error) {
                    console.log('Scroll error, using fallback:', error);
                    // Method 3: Legacy fallback
                    document.documentElement.scrollTop = Math.max(0, targetPosition);
                    document.body.scrollTop = Math.max(0, targetPosition);
                }
                
                // Update URL hash
                history.pushState(null, null, '#' + targetId);
            }
        });
    });

    // Header scroll effect
    const header = document.querySelector('.header');
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
            header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.boxShadow = 'none';
        }

        lastScrollY = currentScrollY;
    });

    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe feature cards and command cards
    const animatedElements = document.querySelectorAll('.feature-card, .command-card');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Copy command functionality
    const commandNames = document.querySelectorAll('.command-name');
    commandNames.forEach(command => {
        command.addEventListener('click', function() {
            const commandText = this.textContent;
            navigator.clipboard.writeText(commandText).then(() => {
                // Show temporary tooltip
                const tooltip = document.createElement('div');
                tooltip.textContent = 'Copied!';
                tooltip.style.cssText = `
                    position: absolute;
                    background: #2563eb;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    z-index: 1000;
                    pointer-events: none;
                    transform: translateX(-50%);
                `;
                
                this.style.position = 'relative';
                this.appendChild(tooltip);
                
                setTimeout(() => {
                    if (tooltip.parentNode) {
                        tooltip.parentNode.removeChild(tooltip);
                    }
                }, 1000);
            });
        });
        
        // Add cursor pointer and title
        command.style.cursor = 'pointer';
        command.title = 'Click to copy command';
    });

    // Stats counter animation (if stats are added later)
    function animateCounter(element, target, duration = 2000) {
        let start = 0;
        const increment = target / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            element.textContent = Math.floor(start).toLocaleString();
            if (start >= target) {
                element.textContent = target.toLocaleString();
                clearInterval(timer);
            }
        }, 16);
    }

    // API Cache Manager
    class ApiCache {
        static cacheKey = 'gardenNotifierStats';
        static timestampKey = 'gardenNotifierStatsTimestamp';
        static commandsCacheKey = 'gardenNotifierCommands';
        static commandsTimestampKey = 'gardenNotifierCommandsTimestamp';
        static cacheValidMinutes = 10; // Cache valid for 10 minutes
        static rateLimitMinutes = 3; // Rate limit: 3 minutes between API calls

        static isRateLimited() {
            const lastFetch = localStorage.getItem('lastAPIFetch');
            if (!lastFetch) return false;
            
            const now = Date.now();
            const timeSinceLastFetch = now - parseInt(lastFetch);
            const rateLimitMs = this.rateLimitMinutes * 60 * 1000;
            
            return timeSinceLastFetch < rateLimitMs;
        }

        static isCacheValid(type = 'stats') {
            const timestamp = localStorage.getItem(type === 'commands' ? this.commandsTimestampKey : this.timestampKey);
            if (!timestamp) return false;
            
            const now = Date.now();
            const cacheAge = now - parseInt(timestamp);
            const cacheValidMs = this.cacheValidMinutes * 60 * 1000;
            
            return cacheAge < cacheValidMs;
        }

        static getCachedStats() {
            try {
                const cached = localStorage.getItem(this.cacheKey);
                return cached ? JSON.parse(cached) : null;
            } catch (error) {
                console.error('Failed to parse cached stats:', error);
                return null;
            }
        }

        static getCachedCommands() {
            try {
                const cached = localStorage.getItem(this.commandsCacheKey);
                return cached ? JSON.parse(cached) : null;
            } catch (error) {
                console.error('Failed to parse cached commands:', error);
                return null;
            }
        }

        static setCachedStats(stats) {
            try {
                localStorage.setItem(this.cacheKey, JSON.stringify(stats));
                localStorage.setItem(this.timestampKey, Date.now().toString());
                localStorage.setItem('lastAPIFetch', Date.now().toString());
            } catch (error) {
                console.error('Failed to cache stats:', error);
            }
        }

        static setCachedCommands(commands) {
            try {
                localStorage.setItem(this.commandsCacheKey, JSON.stringify(commands));
                localStorage.setItem(this.commandsTimestampKey, Date.now().toString());
                localStorage.setItem('lastAPIFetch', Date.now().toString());
            } catch (error) {
                console.error('Failed to cache stats:', error);
            }
        }

        static getCacheInfo() {
            const timestamp = localStorage.getItem(this.timestampKey);
            const lastFetch = localStorage.getItem('lastAPIFetch');
            
            if (!timestamp) return null;
            
            const now = Date.now();
            const cacheAge = Math.floor((now - parseInt(timestamp)) / 1000 / 60);
            const lastFetchAge = lastFetch ? Math.floor((now - parseInt(lastFetch)) / 1000 / 60) : null;
            
            // Calculate when cache expires and when next fetch is allowed
            const cacheExpiresAt = new Date(parseInt(timestamp) + (this.cacheValidMinutes * 60 * 1000));
            const nextFetchAllowedAt = lastFetch ? new Date(parseInt(lastFetch) + (this.rateLimitMinutes * 60 * 1000)) : new Date();
            
            return {
                ageMinutes: cacheAge,
                lastFetchMinutes: lastFetchAge,
                isValid: this.isCacheValid(),
                isRateLimited: this.isRateLimited(),
                cacheExpiresAt: cacheExpiresAt,
                nextFetchAllowedAt: nextFetchAllowedAt,
                cacheExpiresIn: Math.max(0, Math.ceil((cacheExpiresAt - now) / 1000 / 60)),
                nextFetchIn: Math.max(0, Math.ceil((nextFetchAllowedAt - now) / 1000 / 60))
            };
        }
    }

    // Load bot stats with intelligent caching
    async function loadBotStats(forceRefresh = false) {
        const cacheInfo = ApiCache.getCacheInfo();
        
        // Log cache status on page load
        if (cacheInfo) {
            console.log('📊 Cache Status:');
            console.log(`   Cache age: ${cacheInfo.ageMinutes} minutes`);
            console.log(`   Cache expires in: ${cacheInfo.cacheExpiresIn} minutes (at ${cacheInfo.cacheExpiresAt.toLocaleTimeString()})`);
            console.log(`   Rate limit: Next fetch allowed in ${cacheInfo.nextFetchIn} minutes (at ${cacheInfo.nextFetchAllowedAt.toLocaleTimeString()})`);
            console.log(`   Cache valid: ${cacheInfo.isValid ? '✅' : '❌'}`);
            console.log(`   Rate limited: ${cacheInfo.isRateLimited ? '🚫' : '✅'}`);
        } else {
            console.log('📊 No cache found - will fetch fresh data');
        }
        
        // Show cached data immediately if available
        const cachedStats = ApiCache.getCachedStats();
        if (cachedStats && !forceRefresh) {
            console.log(`📦 Loading cached stats (${cacheInfo?.ageMinutes || 0} minutes old)`);
            updateStatsDisplay(cachedStats, true);
        }

        // Check if we should fetch fresh data
        const shouldFetch = forceRefresh || 
                           !ApiCache.isCacheValid('stats') || 
                           !cachedStats;

        const isRateLimited = ApiCache.isRateLimited();

        if (shouldFetch && !isRateLimited) {
            try {
                console.log('🔄 Fetching fresh bot stats...');
                
                // Fetch with timeout helper
                const fetchWithTimeout = (url, timeout = 10000) => {
                    return Promise.race([
                        fetch(url),
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Request timeout')), timeout)
                        )
                    ]);
                };

                // Fetch from stats endpoint only
                const statsResponse = await fetchWithTimeout('https://api.gardennotifier.xyz/api/stats');

                if (!statsResponse.ok) {
                    throw new Error(`HTTP error! stats: ${statsResponse.status}`);
                }

                const statsData = await statsResponse.json();

                const freshStats = {
                    servers: statsData.stats.guilds || 0,
                    users: statsData.stats.totalMembers || 0,
                    notifications: statsData.stats.notifications?.total || 0,
                    uptime: statsData.stats.uptime ? formatUptime(statsData.stats.uptime.seconds) : '0s'
                };

                // Cache the fresh data
                ApiCache.setCachedStats(freshStats);
                
                console.log('✅ Fresh bot stats loaded and cached:', freshStats);
                updateStatsDisplay(freshStats, false);

            } catch (error) {
                console.error('❌ Failed to load fresh bot stats:', error);
                
                // If we have cached data, continue using it
                if (cachedStats) {
                    console.log('⚠️ Using cached stats due to API error');
                    updateStatsDisplay(cachedStats, true, true);
                } else {
                    // Only use fallback if no cache exists
                    const fallbackStats = {
                        servers: 4200,
                        users: 600000,
                        notifications: 1000000,
                        uptime: formatUptime(86400) // 24 hours in seconds
                    };
                    console.log('🔄 Using fallback stats (no cache available)');
                    updateStatsDisplay(fallbackStats, false, true);
                }
            }
        } else if (isRateLimited) {
            const minutesUntilNextFetch = cacheInfo ? cacheInfo.nextFetchIn : 0;
            console.log(`⏱️ Rate limited, using cached data (next fetch in ${minutesUntilNextFetch} minutes)`);
            if (cachedStats) {
                updateStatsDisplay(cachedStats, true);
            }
        }
    }

    // Update the display with visual indicators for cache status
    function updateStatsDisplay(stats, isFromCache = false, hasError = false) {
        const statNumbers = document.querySelectorAll('.stat-number');
        const statLabels = ['servers', 'users', 'notifications', 'uptime'];
        
        // Update timestamp
        updateStatsTimestamp(isFromCache);
        
        // Add cache indicator
        addCacheIndicator(isFromCache, hasError);
        
        statNumbers.forEach((element, index) => {
            const statType = statLabels[index];
            const value = stats[statType] || 0;
            
            // Handle uptime differently - it's a string, not a number
            if (statType === 'uptime') {
                element.textContent = value;
            } else {
                element.setAttribute('data-target', value);
                
                // Animate when element comes into view
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            animateCounter(element, value);
                            observer.unobserve(element);
                        }
                    });
                });
                observer.observe(element);
            }
        });
    }

    // Update timestamp displays
    function updateTimestamp(elementId, isFromCache = false) {
        const timestampElement = document.getElementById(elementId);
        if (!timestampElement) return;
        
        const timeOptions = {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        };
        
        if (isFromCache) {
            // Show when the cached data was originally fetched
            const cacheInfo = ApiCache.getCacheInfo();
            if (cacheInfo && cacheInfo.lastFetchMinutes !== null) {
                const lastFetchTime = new Date(Date.now() - (cacheInfo.lastFetchMinutes * 60 * 1000));
                timestampElement.textContent = `${lastFetchTime.toLocaleTimeString([], timeOptions)} (📦 cached)`;
            } else {
                // Fallback to cache timestamp if last fetch time is not available
                const timestamp = localStorage.getItem(ApiCache.timestampKey);
                if (timestamp) {
                    const cacheTime = new Date(parseInt(timestamp));
                    timestampElement.textContent = `${cacheTime.toLocaleTimeString([], timeOptions)} (📦 cached)`;
                } else {
                    timestampElement.textContent = `cached data`;
                }
            }
        } else {
            // Show current time for fresh data
            timestampElement.textContent = `${new Date().toLocaleTimeString([], timeOptions)} (🔄 live)`;
        }
    }

    function updateStatsTimestamp(isFromCache = false) {
        updateTimestamp('stats-timestamp', isFromCache);
    }

    function updateCommandsTimestamp(isFromCache = false) {
        updateTimestamp('commands-timestamp', isFromCache);
    }

    // Add visual indicator for cache status (only for errors)
    function addCacheIndicator(isFromCache, hasError) {
        // Remove existing indicator
        const existingIndicator = document.querySelector('.cache-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }

        // Only show indicators for errors, not normal cache usage
        if (hasError) {
            const statsSection = document.querySelector('.stats');
            if (statsSection) {
                const indicator = document.createElement('div');
                indicator.className = 'cache-indicator';
                
                const cacheInfo = ApiCache.getCacheInfo();
                const ageText = cacheInfo ? `${cacheInfo.ageMinutes}m ago` : 'cached';
                
                indicator.innerHTML = `
                    <span class="cache-status error">
                        ⚠️ API temporarily unavailable - showing ${isFromCache ? 'cached' : 'fallback'} data (${ageText})
                    </span>
                `;
                
                statsSection.appendChild(indicator);
                
                // Auto-remove error indicator after 15 seconds
                setTimeout(() => {
                    if (indicator.parentNode) {
                        indicator.remove();
                    }
                }, 15000);
            }
        }
    }

    // Function to load and update commands
    async function loadBotCommands(forceRefresh = false) {
        // Show cached data immediately if available
        const cachedCommands = ApiCache.getCachedCommands();
        if (cachedCommands && !forceRefresh) {
            console.log('📦 Loading cached commands');
            updateCommandsDisplay(cachedCommands, true);
        }

        // Check if we should fetch fresh data
        const shouldFetch = forceRefresh || 
                           !ApiCache.isCacheValid('commands') || 
                           !cachedCommands;

        const isRateLimited = ApiCache.isRateLimited();

        if (shouldFetch && !isRateLimited) {
            try {
                console.log('🔄 Fetching fresh bot commands...');
                
                const response = await fetch('https://api.gardennotifier.xyz/api/commands');

                if (!response.ok) {
                    throw new Error(`HTTP error! commands: ${response.status}`);
                }

                const commandsData = await response.json();
                
                // Cache the fresh data
                ApiCache.setCachedCommands(commandsData.commands);
                
                console.log('✅ Fresh bot commands loaded and cached:', commandsData.commands);
                updateCommandsDisplay(commandsData.commands, false);

            } catch (error) {
                console.error('❌ Failed to load fresh bot commands:', error);
                
                // If we have cached data, continue using it
                if (cachedCommands) {
                    console.log('⚠️ Using cached commands due to API error');
                    updateCommandsDisplay(cachedCommands, true, true);
                }
            }
        }
    }

    // Helper function to determine command type
    function getCommandType(command) {
        const name = command.name.toLowerCase();
        if (name === 'config') return 'Admin';
        if (['info', 'last-seen', 'future-stock'].includes(name)) return 'Information';
        if (['calculator', 'restocks', 'weather'].includes(name)) return 'Utility';
        if (['vote', 'feedback', 'donate'].includes(name)) return 'General';
        return 'Utility';
    }

    function updateCommandsDisplay(commands, isFromCache = false, hasError = false) {
        const commandsContainer = document.querySelector('.commands-grid');
        if (!commandsContainer) return;

        commandsContainer.innerHTML = '';

        commands.forEach(command => {
            const commandType = getCommandType(command);
            const commandCard = document.createElement('div');
            commandCard.className = 'command-card';
            commandCard.innerHTML = `
                <div class="command-header">
                    <span class="command-name">/${command.name}</span>
                    <span class="command-type">${commandType}</span>
                </div>
                <p>${command.description}</p>
            `;
            commandsContainer.appendChild(commandCard);
        });

        // Update the timestamp
        updateCommandsTimestamp(isFromCache);
    }

    // Load stats when page loads
    loadBotStats();
    loadBotCommands();

    // Refresh stats and commands every 5 minutes (intelligent refresh - will use cache if rate limited)
    setInterval(() => {
        loadBotStats();
        loadBotCommands();
    }, 5 * 60 * 1000);

    // Load placeholder images with fade effect
    const images = document.querySelectorAll('img[src*="placeholder"]');
    images.forEach(img => {
        img.addEventListener('load', function() {
            this.style.opacity = '1';
        });
    });

    // Mobile menu functionality
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const navigationLinks = document.querySelector('.nav-links');
    
    if (menuToggle && navigationLinks) {
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            navigationLinks.classList.toggle('nav-links-active');
            
            // Toggle hamburger animation
            const icon = this.querySelector('i');
            if (navigationLinks.classList.contains('nav-links-active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
                // Prevent body scroll when menu is open without layout shifts
                const scrollY = window.scrollY;
                document.body.style.position = 'fixed';
                document.body.style.top = `-${scrollY}px`;
                document.body.style.width = '100%';
                document.body.classList.add('menu-open');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
                // Restore body scroll and position
                const scrollY = document.body.style.top;
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';
                document.body.classList.remove('menu-open');
                window.scrollTo(0, parseInt(scrollY || '0') * -1);
            }
        });

        // Close menu when clicking on a link
        const navLinksItems = navigationLinks.querySelectorAll('a');
        navLinksItems.forEach(link => {
            link.addEventListener('click', () => {
                navigationLinks.classList.remove('nav-links-active');
                const icon = menuToggle.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
                // Restore body scroll and position
                const scrollY = document.body.style.top;
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';
                document.body.classList.remove('menu-open');
                window.scrollTo(0, parseInt(scrollY || '0') * -1);
            });
        });

        // Close menu when clicking outside (on the overlay area)
        document.addEventListener('click', function(event) {
            if (navigationLinks.classList.contains('nav-links-active') && 
                !menuToggle.contains(event.target) && 
                !navigationLinks.contains(event.target)) {
                navigationLinks.classList.remove('nav-links-active');
                const icon = menuToggle.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
                // Restore body scroll and position
                const scrollY = document.body.style.top;
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';
                document.body.classList.remove('menu-open');
                window.scrollTo(0, parseInt(scrollY || '0') * -1);
            }
        });

        // Close menu on escape key
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && navigationLinks.classList.contains('nav-links-active')) {
                navigationLinks.classList.remove('nav-links-active');
                const icon = menuToggle.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
                // Restore body scroll and position
                const scrollY = document.body.style.top;
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';
                document.body.classList.remove('menu-open');
                window.scrollTo(0, parseInt(scrollY || '0') * -1);
            }
        });
    }
});

// Coming soon modal functionality
function showComingSoon() {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
        backdrop-filter: blur(5px);
    `;

    // Create modal content
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        padding: 2rem;
        border-radius: 16px;
        text-align: center;
        max-width: 400px;
        margin: 0 20px;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
        transform: scale(0.9);
        transition: transform 0.3s ease;
    `;

    modal.innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 1rem;">🚧</div>
        <h3 style="margin-bottom: 1rem; color: #1e293b;">Coming Soon!</h3>
        <p style="color: #64748b; margin-bottom: 1.5rem;">This feature is currently under development and will be available soon.</p>
        <button onclick="this.closest('.modal-overlay').remove()" style="
            background: #2563eb;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            transition: background 0.3s ease;
        " onmouseover="this.style.background='#1d4ed8'" onmouseout="this.style.background='#2563eb'">
            Got it!
        </button>
    `;

    overlay.className = 'modal-overlay';
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Animate modal in
    setTimeout(() => {
        modal.style.transform = 'scale(1)';
    }, 10);

    // Close on overlay click
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            overlay.remove();
        }
    });

    // Close on escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            overlay.remove();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

// Utility function to format uptime into readable format
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) {
        return `${days}d ${hours}h`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

// Utility function to format numbers
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Performance optimization: Debounce scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Easter egg: Konami code
let konamiCode = [];
const konamiSequence = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'KeyB', 'KeyA'
];

document.addEventListener('keydown', (e) => {
    konamiCode.push(e.code);
    if (konamiCode.length > konamiSequence.length) {
        konamiCode.shift();
    }
    
    if (konamiCode.join(',') === konamiSequence.join(',')) {
        // Easter egg activated
        document.body.style.background = 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57, #ff9ff3, #54a0ff)';
        document.body.style.backgroundSize = '400% 400%';
        document.body.style.animation = 'rainbowGradient 3s ease infinite';
        
        // Add rainbow animation keyframes
        if (!document.getElementById('rainbow-styles')) {
            const style = document.createElement('style');
            style.id = 'rainbow-styles';
            style.textContent = `
                @keyframes rainbowGradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
            `;
            document.head.appendChild(style);
        }
        
        setTimeout(() => {
            document.body.style.background = '';
            document.body.style.animation = '';
        }, 5000);
        
        konamiCode = [];
    }
});
