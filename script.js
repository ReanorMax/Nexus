document.addEventListener('DOMContentLoaded', function() {
    // Tab functionality
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const footerLinks = document.querySelectorAll('.tab-footer-links');
    
    const setActiveTab = (tabId) => {
        // Hide all tab contents
        tabContents.forEach(content => {
            content.classList.remove('active');
        });
        
        // Show selected tab content
        document.getElementById(tabId).classList.add('active');
        
        // Update footer links
        footerLinks.forEach(links => {
            links.classList.remove('active');
        });
        
        const footerLinksId = tabId === 'product-tab' ? 'product-footer-links' : 
                              tabId === 'installation-tab' ? 'installation-footer-links' : 
                              tabId === 'apt-tab' ? 'apt-footer-links' : 
                              tabId === 'deb-packages-tab' ? 'deb-packages-footer-links' : 
                              tabId === 'visualization-tab' ? 'visualization-footer-links' : 'other-repos-footer-links';
        document.getElementById(footerLinksId).classList.add('active');
        
        // Update active tab button
        tabBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabId) {
                btn.classList.add('active');
            }
        });
        
        // Save active tab to session storage
        sessionStorage.setItem('activeTab', tabId);
    };
    
    // Tab click handlers - use event delegation for better performance
    document.querySelector('.tabs').addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-btn')) {
            const tabId = e.target.dataset.tab;
            setActiveTab(tabId);
            // Scroll to top when switching tabs
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    });
    
    // Check if there's a saved tab in session storage
    const savedTab = sessionStorage.getItem('activeTab');
    if (savedTab) {
        setActiveTab(savedTab);
    } else {
        // Set initial active tab footer links
        document.getElementById('product-footer-links').classList.add('active');
    }
    
    // Smooth scrolling for anchor links - use event delegation
    document.addEventListener('click', function(e) {
        if (e.target.tagName === 'A' && e.target.getAttribute('href') && e.target.getAttribute('href').startsWith('#')) {
            e.preventDefault();
            
            const targetId = e.target.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                // Determine which tab this link belongs to
                let tabId = 'product-tab';
                if (targetId === '#installation' || targetId === '#nexus-docker') {
                    tabId = 'installation-tab';
                } else if (targetId.startsWith('#apt')) {
                    tabId = 'apt-tab';
                } else if (targetId.startsWith('#deb')) {
                    tabId = 'deb-packages-tab';
                } else if (targetId.startsWith('#visualization')) {
                    tabId = 'visualization-tab';
                }
                
                // Set the correct tab first
                setActiveTab(tabId);
                
                // Then scroll to the element
                setTimeout(() => {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }, 100);
            }
        }
    });

    // Copy code functionality
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('copy-btn') || e.target.closest('.copy-btn')) {
            const button = e.target.classList.contains('copy-btn') ? e.target : e.target.closest('.copy-btn');
            const code = button.getAttribute('data-code');
            
            if (navigator.clipboard) {
                navigator.clipboard.writeText(code).then(() => {
                    button.innerHTML = `
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 6L9 17L4 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    `;
                    button.style.color = 'white';
                    button.style.backgroundColor = 'var(--sonatype-green)';
                    
                    setTimeout(() => {
                        button.innerHTML = `
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 9H11C9.89543 9 9 9.89543 9 11V20C9 21.1046 9.89543 22 11 22H20C21.1046 22 22 21.1046 22 20V11C22 9.89543 21.1046 9 20 9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M5 15H4C3.46957 15 2.96086 14.7893 2.58579 14.4142C2.21071 14.0391 2 13.5304 2 13V4C2 3.46957 2.21071 2.96086 2.58579 2.58579C2.96086 2.21071 3.46957 2 4 2H13C13.5304 2 14.0391 2.21071 14.4142 2.58579C14.7893 2.96086 15 3.46957 15 4V5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        `;
                        button.style.color = '';
                        button.style.backgroundColor = '';
                    }, 2000);
                }).catch(err => {
                    console.error('Could not copy text: ', err);
                });
            }
        }
    });
    
    // Add proper loading for the page
    document.body.classList.add('loaded');
    
    // Visualization logic
    if (document.getElementById('start-visualization')) {
        const startBtn = document.getElementById('start-visualization');
        const resetBtn = document.getElementById('reset-visualization');
        const steps = document.querySelectorAll('.visualization-steps .step');
        
        let currentStep = 0;
        let isAnimating = false;
        let animationInterval;
        
        // Set up visualization scene
        function setupScene() {
            // Position connectors
            positionConnectors();
            
            // Reset state
            document.querySelectorAll('.artifact-object').forEach(artifact => {
                artifact.style.opacity = 0;
            });
            
            document.querySelectorAll('.connector').forEach(connector => {
                connector.style.opacity = 0;
            });
            
            document.querySelectorAll('.process-indicator').forEach(indicator => {
                indicator.style.opacity = 0;
            });
            
            document.querySelectorAll('.repo-layer').forEach(layer => {
                layer.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            });
            
            // Reset steps
            steps.forEach(step => {
                step.classList.remove('active');
            });
            steps[0].classList.add('active');
            
            currentStep = 0;
        }
        
        function positionConnectors() {
            // Developer to Nexus
            const developer = document.querySelector('.developer-system');
            const nexus = document.querySelector('.nexus-server');
            const connector1 = document.getElementById('connector1');
            
            if (developer && nexus && connector1) {
                const devRect = developer.getBoundingClientRect();
                const nexusRect = nexus.getBoundingClientRect();
                const sceneBounds = document.querySelector('.visualization-scene').getBoundingClientRect();
                
                const startX = devRect.left - sceneBounds.left + devRect.width;
                const startY = devRect.top - sceneBounds.top + devRect.height/2;
                const endX = nexusRect.left - sceneBounds.left;
                const endY = nexusRect.top - sceneBounds.top + nexusRect.height/2;
                
                const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
                const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
                
                connector1.style.width = `${length}px`;
                connector1.style.left = `${startX}px`;
                connector1.style.top = `${startY}px`;
                connector1.style.transform = `rotate(${angle}deg)`;
            }
            
            // Nexus to Central Registry
            const central = document.querySelector('.central-registry');
            const connector2 = document.getElementById('connector2');
            
            if (nexus && central && connector2) {
                const nexusRect = nexus.getBoundingClientRect();
                const centralRect = central.getBoundingClientRect();
                const sceneBounds = document.querySelector('.visualization-scene').getBoundingClientRect();
                
                const startX = nexusRect.left - sceneBounds.left + nexusRect.width;
                const startY = nexusRect.top - sceneBounds.top + nexusRect.height/2;
                const endX = centralRect.left - sceneBounds.left;
                const endY = centralRect.top - sceneBounds.top + centralRect.height/2;
                
                const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
                const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
                
                connector2.style.width = `${length}px`;
                connector2.style.left = `${startX}px`;
                connector2.style.top = `${startY}px`;
                connector2.style.transform = `rotate(${angle}deg)`;
            }
            
            // Nexus to Client
            const client = document.querySelector('.client-system');
            const connector3 = document.getElementById('connector3');
            
            if (nexus && client && connector3) {
                const nexusRect = nexus.getBoundingClientRect();
                const clientRect = client.getBoundingClientRect();
                const sceneBounds = document.querySelector('.visualization-scene').getBoundingClientRect();
                
                const startX = nexusRect.left - sceneBounds.left + nexusRect.width/2;
                const startY = nexusRect.top - sceneBounds.top + nexusRect.height;
                const endX = clientRect.left - sceneBounds.left + clientRect.width/2;
                const endY = clientRect.top - sceneBounds.top;
                
                const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
                const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
                
                connector3.style.width = `${length}px`;
                connector3.style.left = `${startX}px`;
                connector3.style.top = `${startY}px`;
                connector3.style.transform = `rotate(${angle}deg)`;
            }
        }
        
        function animateStep(step) {
            if (isAnimating) return;
            isAnimating = true;
            
            // Update active step
            steps.forEach(s => s.classList.remove('active'));
            steps[step].classList.add('active');
            
            switch(step) {
                case 0:
                    // Developer publishes artifact to Nexus
                    const artifact1 = document.getElementById('artifact1');
                    const hostedLayer = document.getElementById('repo-hosted');
                    const connector1 = document.getElementById('connector1');
                    const indicator1 = document.getElementById('process-indicator1');
                    
                    if (!artifact1 || !hostedLayer || !connector1 || !indicator1) {
                        isAnimating = false;
                        return;
                    }
                    
                    // Show connector
                    connector1.style.opacity = 1;
                    
                    // Position and show process indicator
                    const conn1Rect = connector1.getBoundingClientRect();
                    const sceneRect = document.querySelector('.visualization-scene').getBoundingClientRect();
                    indicator1.style.left = `${(conn1Rect.left - sceneRect.left + conn1Rect.width/2) - 40}px`;
                    indicator1.style.top = `${conn1Rect.top - sceneRect.top - 25}px`;
                    indicator1.style.opacity = 1;
                    
                    // Animate artifact
                    artifact1.style.opacity = 1;
                    artifact1.style.transition = 'transform 1s ease, opacity 0.5s ease';
                    
                    setTimeout(() => {
                        artifact1.style.transform = 'translate(150px, 100px)';
                    }, 500);
                    
                    setTimeout(() => {
                        artifact1.style.opacity = 0.5;
                        hostedLayer.style.backgroundColor = 'rgba(0, 206, 124, 0.3)';
                        
                        setTimeout(() => {
                            isAnimating = false;
                            if (animationInterval) goToNextStep();
                        }, 500);
                    }, 1500);
                    break;
                    
                case 1:
                    // Client requests artifact
                    const connector3 = document.getElementById('connector3');
                    const groupLayer = document.getElementById('repo-group');
                    const indicator3 = document.getElementById('process-indicator3');
                    
                    if (!connector3 || !groupLayer || !indicator3) {
                        isAnimating = false;
                        return;
                    }
                    
                    // Show connector
                    connector3.style.opacity = 1;
                    
                    // Position and show process indicator
                    const conn3Rect = connector3.getBoundingClientRect();
                    const scene3Rect = document.querySelector('.visualization-scene').getBoundingClientRect();
                    indicator3.style.left = `${(conn3Rect.left - scene3Rect.left + conn3Rect.width/2) - 40}px`;
                    indicator3.style.top = `${conn3Rect.top - scene3Rect.top + conn3Rect.height/2}px`;
                    indicator3.style.opacity = 1;
                    
                    // Highlight group layer
                    setTimeout(() => {
                        groupLayer.style.backgroundColor = 'rgba(255, 165, 0, 0.3)';
                        
                        setTimeout(() => {
                            isAnimating = false;
                            if (animationInterval) goToNextStep();
                        }, 500);
                    }, 1000);
                    break;
                    
                case 2:
                    // Nexus requests from Central
                    const connector2 = document.getElementById('connector2');
                    const proxyLayer = document.getElementById('repo-proxy');
                    const indicator2 = document.getElementById('process-indicator2');
                    
                    if (!connector2 || !proxyLayer || !indicator2) {
                        isAnimating = false;
                        return;
                    }
                    
                    // Show connector
                    connector2.style.opacity = 1;
                    
                    // Position and show process indicator
                    const conn2Rect = connector2.getBoundingClientRect();
                    const scene2Rect = document.querySelector('.visualization-scene').getBoundingClientRect();
                    indicator2.style.left = `${(conn2Rect.left - scene2Rect.left + conn2Rect.width/2) - 40}px`;
                    indicator2.style.top = `${conn2Rect.top - scene2Rect.top - 25}px`;
                    indicator2.style.opacity = 1;
                    
                    // Highlight proxy layer
                    setTimeout(() => {
                        proxyLayer.style.backgroundColor = 'rgba(0, 119, 181, 0.3)';
                        
                        setTimeout(() => {
                            isAnimating = false;
                            if (animationInterval) goToNextStep();
                        }, 500);
                    }, 1000);
                    break;
                    
                case 3:
                    // Nexus caches artifact
                    const artifact2 = document.getElementById('artifact2');
                    const proxyLayer2 = document.getElementById('repo-proxy');
                    
                    if (!artifact2 || !proxyLayer2) {
                        isAnimating = false;
                        if (animationInterval) goToNextStep();
                        return;
                    }
                    
                    // Show artifact at central
                    artifact2.style.opacity = 1;
                    artifact2.style.transform = 'translate(0, 0)';
                    artifact2.style.transition = 'transform 1s ease, opacity 0.5s ease';
                    
                    // Move to Nexus
                    setTimeout(() => {
                        artifact2.style.transform = 'translate(-150px, 100px)';
                        
                        setTimeout(() => {
                            proxyLayer2.style.backgroundColor = 'rgba(0, 206, 124, 0.3)';
                            
                            setTimeout(() => {
                                isAnimating = false;
                                if (animationInterval) goToNextStep();
                            }, 500);
                        }, 1000);
                    }, 1000);
                    break;
                    
                case 4:
                    // Client receives artifact
                    const artifact2Final = document.getElementById('artifact2');
                    
                    if (!artifact2Final) {
                        isAnimating = false;
                        if (animationInterval) {
                            clearInterval(animationInterval);
                            animationInterval = null;
                            startBtn.textContent = 'Запустить визуализацию';
                        }
                        return;
                    }
                    
                    setTimeout(() => {
                        artifact2Final.style.transform = 'translate(-300px, 200px)';
                        
                        setTimeout(() => {
                            artifact2Final.style.opacity = 0;
                            
                            setTimeout(() => {
                                // End of animation, stop auto-play if active
                                if (animationInterval) {
                                    clearInterval(animationInterval);
                                    animationInterval = null;
                                    startBtn.textContent = 'Запустить визуализацию';
                                }
                                isAnimating = false;
                            }, 500);
                        }, 1000);
                    }, 500);
                    break;
            }
        }
        
        function goToNextStep() {
            currentStep = (currentStep + 1) % steps.length;
            animateStep(currentStep);
        }
        
        // Resize handling
        window.addEventListener('resize', function() {
            if (document.getElementById('visualization-tab').classList.contains('active')) {
                positionConnectors();
            }
        });
        
        // Click events for steps
        steps.forEach((step, index) => {
            step.addEventListener('click', function() {
                if (animationInterval) {
                    clearInterval(animationInterval);
                    animationInterval = null;
                    startBtn.textContent = 'Запустить визуализацию';
                }
                
                setupScene();
                currentStep = index;
                animateStep(currentStep);
            });
        });
        
        // Start visualization
        startBtn.addEventListener('click', function() {
            if (animationInterval) {
                // Stop auto-play
                clearInterval(animationInterval);
                animationInterval = null;
                startBtn.textContent = 'Запустить визуализацию';
            } else {
                // Start auto-play
                setupScene();
                animateStep(currentStep);
                
                animationInterval = setInterval(function() {
                    if (!isAnimating) {
                        goToNextStep();
                    }
                }, 3000);
                
                startBtn.textContent = 'Остановить';
            }
        });
        
        // Reset visualization
        resetBtn.addEventListener('click', function() {
            if (animationInterval) {
                clearInterval(animationInterval);
                animationInterval = null;
                startBtn.textContent = 'Запустить визуализацию';
            }
            
            setupScene();
        });
        
        // Initialize visualization
        if (document.getElementById('visualization-tab').classList.contains('active')) {
            setupScene();
        }
    }
    
    // Add footer links for the visualization tab
    const footerLinksId = 'visualization-footer-links';
    if (!document.getElementById(footerLinksId)) {
        const footerLinks = document.createElement('div');
        footerLinks.id = footerLinksId;
        footerLinks.className = 'tab-footer-links';
        footerLinks.innerHTML = `
            <ul>
                <li><a href="#visualization-demo">Визуализация работы</a></li>
                <li><a href="#lifecycle">Жизненный цикл</a></li>
            </ul>
        `;
        document.querySelector('.footer-links').appendChild(footerLinks);
    }
    
    // Add animation triggers based on scroll
    function checkVisibility() {
        const elements = document.querySelectorAll('.feature-icon-card, .repo-card, .benefit-card, .premium-card, .lifecycle-stage');
        
        elements.forEach(element => {
            const position = element.getBoundingClientRect();
            
            // Check if element is in viewport
            if(position.top < window.innerHeight && position.bottom >= 0) {
                element.classList.add('animate');
                
                if(element.classList.contains('lifecycle-stage')) {
                    // Stagger animation for lifecycle stages
                    const index = Array.from(element.parentNode.children).indexOf(element);
                    if(index > 0 && index % 2 === 0) { // Only target the stage elements, not arrows
                        element.style.animationDelay = `${index * 0.2}s`;
                    }
                }
            }
        });
    }
    
    // Check elements visibility on scroll
    window.addEventListener('scroll', checkVisibility);
    
    // Initial check
    checkVisibility();
    
    // Add shadow pulse effect to important elements
    const importantElements = document.querySelectorAll('.hero-content h1, .premium-card .step-number, .access-url, .nexus-server');
    importantElements.forEach(element => {
        element.classList.add('shadow-pulse');
    });
    
    // Add special hover effects for repository layers in visualization
    const repoLayers = document.querySelectorAll('.repo-layer');
    repoLayers.forEach(layer => {
        layer.addEventListener('mouseenter', function() {
            this.classList.add('active');
        });
        
        layer.addEventListener('mouseleave', function() {
            this.classList.remove('active');
        });
    });
    
    // Special animation for code blocks
    const codeBlocks = document.querySelectorAll('.code-block');
    codeBlocks.forEach(block => {
        block.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.02)';
            this.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
            this.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.2)';
        });
        
        block.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
            this.style.boxShadow = '';
        });
    });
    
    // Refined visualization animation
    if (document.getElementById('visualization-tab')) {
        const visualizationScene = document.querySelector('.visualization-scene');
        
        visualizationScene.addEventListener('mouseenter', function() {
            document.querySelectorAll('.entity').forEach(entity => {
                entity.style.filter = 'brightness(1.2)';
            });
        });
        
        visualizationScene.addEventListener('mouseleave', function() {
            document.querySelectorAll('.entity').forEach(entity => {
                entity.style.filter = '';
            });
        });
    }
    
    // Add subtle parallax effect to hero section
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        window.addEventListener('mousemove', function(e) {
            const moveX = (e.clientX - window.innerWidth / 2) * 0.02;
            const moveY = (e.clientY - window.innerHeight / 2) * 0.02;
            
            const blob = document.querySelector('.blob-animation');
            const artifacts = document.querySelectorAll('.artifact');
            
            if (blob) {
                blob.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.1)`;
            }
            
            artifacts.forEach(artifact => {
                const speed = parseFloat(artifact.getAttribute('data-speed') || 0.04);
                artifact.style.transform = `translate(${moveX * speed * 5}px, ${moveY * speed * 5}px)`;
            });
        });
    }
});