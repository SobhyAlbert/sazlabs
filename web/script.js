document.addEventListener("DOMContentLoaded", () => {
    const hamburger = document.querySelector(".hamburger");
    const navLinks = document.querySelector(".nav-links");

    function setMenu(open) {
        if (!hamburger || !navLinks) return;
        navLinks.classList.toggle("active", open);
        hamburger.classList.toggle("is-open", open);
        hamburger.setAttribute("aria-expanded", open ? "true" : "false");
        hamburger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }

    if (hamburger && navLinks) {
        hamburger.addEventListener("click", () => {
            setMenu(!navLinks.classList.contains("active"));
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && navLinks.classList.contains("active")) {
                setMenu(false);
                hamburger.focus();
            }
        });

        document.addEventListener("click", (event) => {
            if (!navLinks.classList.contains("active")) return;
            if (navLinks.contains(event.target) || hamburger.contains(event.target)) return;
            setMenu(false);
        });
    }

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", function (event) {
            const targetId = this.getAttribute("href");
            if (!targetId || targetId === "#") return;
            const targetElement = document.querySelector(targetId);
            if (!targetElement) return;
            event.preventDefault();
            if (navLinks && navLinks.classList.contains("active")) setMenu(false);
            const navHeight = document.querySelector(".navbar").offsetHeight;
            const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - navHeight;
            window.scrollTo({
                top: targetPosition,
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
            });
        });
    });

    const navbar = document.querySelector(".navbar");
    const sections = document.querySelectorAll("section");
    const navItems = document.querySelectorAll(".nav-links a");

    window.addEventListener("scroll", () => {
        let current = "";
        sections.forEach((section) => {
            const sectionTop = section.offsetTop;
            const navHeight = navbar.offsetHeight;
            if (window.scrollY >= sectionTop - navHeight - 100) {
                current = section.getAttribute("id");
            }
        });

        navItems.forEach((item) => {
            item.style.color = "";
            if (item.getAttribute("href") === `#${current}`) {
                item.style.color = "var(--accent-gold)";
            }
        });
    }, { passive: true });

    const cards = document.querySelectorAll(".service-card");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduceMotion && "IntersectionObserver" in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = 1;
                    entry.target.style.transform = "translateY(0)";
                }
            });
        }, { threshold: 0.1 });

        cards.forEach((card) => {
            card.style.opacity = 0;
            card.style.transform = "translateY(20px)";
            card.style.transition = "opacity 0.6s ease-out, transform 0.6s ease-out";
            observer.observe(card);
        });
    }

    startParticles(document.getElementById("bg-canvas"));
});

function startParticles(canvas) {
    if (!canvas) return;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileQuery = window.matchMedia("(max-width: 768px)");
    if (motionQuery.matches || mobileQuery.matches) {
        canvas.remove();
        return;
    }

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) {
        canvas.remove();
        return;
    }

    let width = 0;
    let height = 0;
    let particles = [];
    let running = true;
    const maxParticles = 32;
    const linkDistance = 110;
    const maxLinksPerFrame = 80;

    function spawn() {
        return {
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.55,
            vy: (Math.random() - 0.5) * 0.55,
            radius: Math.random() * 1.5 + 0.7,
            color: Math.random() > 0.5 ? "#1D4ED8" : "#D4AF37"
        };
    }

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        const count = Math.max(12, Math.min(maxParticles, Math.round((width * height) / 50000)));
        particles = Array.from({ length: count }, spawn);
    }

    function stop() {
        running = false;
        canvas.remove();
    }

    function tick() {
        if (!running) return;
        requestAnimationFrame(tick);
        if (document.hidden) return;

        const started = performance.now();
        ctx.clearRect(0, 0, width, height);

        for (const particle of particles) {
            particle.x += particle.vx;
            particle.y += particle.vy;
            if (particle.x < 0 || particle.x > width) particle.vx *= -1;
            if (particle.y < 0 || particle.y > height) particle.vy *= -1;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fillStyle = particle.color;
            ctx.fill();
        }

        let links = 0;
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                if (links >= maxLinksPerFrame || performance.now() - started > 6) return;
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distSq = dx * dx + dy * dy;
                const maxDistSq = linkDistance * linkDistance;
                if (distSq >= maxDistSq) continue;
                const dist = Math.sqrt(distSq);
                ctx.beginPath();
                ctx.strokeStyle = `rgba(29, 78, 216, ${1 - dist / linkDistance})`;
                ctx.lineWidth = 1;
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
                links += 1;
            }
        }
    }

    let resizeTimer;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (mobileQuery.matches) {
                stop();
                return;
            }
            resize();
        }, 150);
    });

    const onMotionChange = (event) => {
        if (event.matches) stop();
    };
    if (motionQuery.addEventListener) {
        motionQuery.addEventListener("change", onMotionChange);
    }

    resize();
    requestAnimationFrame(tick);
}
