"use strict";
/**
 * Behaviour for the Mbele ECD English Creche website.
 * Compiled to dist/main.js for the browser. There is no server behind the enquiry form.
 */
const CRECHE_EMAIL = "Mbeleecdcreche@gmail.com";
/** Starts each interactive piece once the page structure is available. */
function initWebsite() {
    initHeaderOnScroll();
    initNavigation();
    initRevealAnimations();
    initActiveSection();
    initGalleryLightbox();
    initEnquiryForm();
}
/** Adds a shadow once the visitor scrolls, so the sticky bar stays readable. */
function initHeaderOnScroll() {
    const header = document.querySelector(".site-header");
    if (!header) {
        return;
    }
    const updateHeader = () => {
        header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
}
/** Mobile menu: open, close, Escape, and return focus to the hamburger button. */
function initNavigation() {
    const toggle = document.querySelector(".nav-toggle");
    const navigation = document.querySelector("#site-nav");
    const main = document.querySelector("#main");
    const footer = document.querySelector(".site-footer");
    if (!toggle || !navigation) {
        return;
    }
    const setOpen = (isOpen) => {
        navigation.classList.toggle("is-open", isOpen);
        toggle.classList.toggle("is-open", isOpen);
        toggle.setAttribute("aria-expanded", String(isOpen));
        toggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
        document.body.classList.toggle("nav-open", isOpen);
        setInert(main, isOpen);
        setInert(footer, isOpen);
    };
    toggle.addEventListener("click", () => {
        const isOpen = toggle.getAttribute("aria-expanded") === "true";
        setOpen(!isOpen);
        if (!isOpen) {
            const firstLink = navigation.querySelector("a");
            firstLink?.focus();
        }
    });
    navigation.addEventListener("click", (event) => {
        const target = event.target;
        if (target instanceof HTMLAnchorElement) {
            setOpen(false);
        }
    });
    document.addEventListener("click", (event) => {
        if (toggle.getAttribute("aria-expanded") !== "true") {
            return;
        }
        const target = event.target;
        if (!(target instanceof Node)) {
            return;
        }
        if (navigation.contains(target) || toggle.contains(target)) {
            return;
        }
        setOpen(false);
    });
    window.addEventListener("resize", () => {
        if (window.innerWidth >= 1080 && toggle.getAttribute("aria-expanded") === "true") {
            setOpen(false);
        }
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
            setOpen(false);
            toggle.focus();
        }
    });
}
function setInert(element, inert) {
    if (!element) {
        return;
    }
    if (inert) {
        element.setAttribute("inert", "");
    }
    else {
        element.removeAttribute("inert");
    }
}
/** Fades sections in as they enter the screen. Reduced motion shows them immediately. */
function initRevealAnimations() {
    const items = document.querySelectorAll(".reveal");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches || !("IntersectionObserver" in window)) {
        items.forEach((item) => item.classList.add("is-visible"));
        return;
    }
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                return;
            }
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
        });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    items.forEach((item) => observer.observe(item));
}
/** Marks the navigation link for the section currently in view. */
function initActiveSection() {
    const links = [...document.querySelectorAll("[data-nav]")];
    const sections = links
        .map((link) => document.querySelector(link.hash))
        .filter((section) => section !== null);
    if (sections.length === 0 || !("IntersectionObserver" in window)) {
        return;
    }
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                return;
            }
            links.forEach((link) => {
                const isActive = link.hash === `#${entry.target.id}`;
                link.classList.toggle("is-active", isActive);
                if (isActive) {
                    link.setAttribute("aria-current", "true");
                }
                else {
                    link.removeAttribute("aria-current");
                }
            });
        });
    }, { rootMargin: "-45% 0px -45% 0px", threshold: 0.01 });
    sections.forEach((section) => observer.observe(section));
}
/** Opens a large photo, and moves between photos with buttons or arrow keys. */
function initGalleryLightbox() {
    const dialog = document.querySelector("#lightbox");
    const image = document.querySelector("#lightbox-image");
    const caption = document.querySelector("#lightbox-caption");
    if (!dialog || !image || !caption || typeof dialog.showModal !== "function") {
        return;
    }
    const items = [...document.querySelectorAll(".gallery__trigger")]
        .map((trigger) => {
        const photo = trigger.querySelector("img");
        const fullSrc = trigger.dataset.full ?? "";
        const itemCaption = trigger.dataset.caption ?? "";
        if (!photo || fullSrc === "") {
            return null;
        }
        return {
            trigger,
            fullSrc,
            caption: itemCaption,
            alt: photo.alt,
        };
    })
        .filter((item) => item !== null);
    let currentIndex = 0;
    let lastTrigger = null;
    const showItem = (index) => {
        const item = items[index];
        if (!item) {
            return;
        }
        currentIndex = index;
        image.src = item.fullSrc;
        image.alt = item.alt;
        caption.textContent = item.caption;
    };
    const step = (direction) => {
        if (items.length === 0) {
            return;
        }
        const nextIndex = (currentIndex + direction + items.length) % items.length;
        showItem(nextIndex);
    };
    items.forEach((item, index) => {
        item.trigger.addEventListener("click", () => {
            lastTrigger = item.trigger;
            showItem(index);
            document.body.classList.add("lightbox-open");
            dialog.showModal();
        });
    });
    dialog.querySelector("[data-lightbox-close]")?.addEventListener("click", () => dialog.close());
    dialog.querySelector("[data-lightbox-prev]")?.addEventListener("click", () => step(-1));
    dialog.querySelector("[data-lightbox-next]")?.addEventListener("click", () => step(1));
    dialog.addEventListener("click", (event) => {
        if (event.target === dialog) {
            dialog.close();
        }
    });
    dialog.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight") {
            event.preventDefault();
            step(1);
        }
        if (event.key === "ArrowLeft") {
            event.preventDefault();
            step(-1);
        }
    });
    dialog.addEventListener("close", () => {
        document.body.classList.remove("lightbox-open");
        lastTrigger?.focus();
    });
}
/** Checks the enquiry fields, then opens a mailto link. Nothing is sent to a server. */
function initEnquiryForm() {
    const form = document.querySelector("#enquiry-form");
    const status = document.querySelector("#form-status");
    if (!form || !status) {
        return;
    }
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const details = readEnquiryDetails(form);
        const isValid = validateEnquiryForm(form, details);
        if (!isValid) {
            status.textContent = "";
            const firstInvalid = form.querySelector("[aria-invalid='true']");
            firstInvalid?.focus();
            return;
        }
        window.location.href = buildMailtoLink(details);
        status.textContent =
            "Your email app should open with this enquiry. This website does not store the message. If nothing opens, email Mbeleecdcreche@gmail.com directly.";
    });
}
function readEnquiryDetails(form) {
    const value = (name) => {
        const field = form.elements.namedItem(name);
        if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
            return field.value.trim();
        }
        return "";
    };
    return {
        parentName: value("parentName"),
        phoneNumber: value("phoneNumber"),
        email: value("email"),
        childAge: value("childAge"),
        message: value("message"),
    };
}
function validateEnquiryForm(form, details) {
    const checks = [
        {
            name: "parentName",
            message: "Please enter the parent or guardian's name.",
            valid: details.parentName.length >= 2 && details.parentName.length <= 80,
        },
        {
            name: "phoneNumber",
            message: "Please enter a valid phone number, such as 063 696 4491.",
            valid: isValidSouthAfricanPhone(details.phoneNumber),
        },
        {
            name: "email",
            message: "Please enter a valid email address.",
            valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email),
        },
        {
            name: "childAge",
            message: "Please enter the child's age.",
            valid: details.childAge.length >= 1 && details.childAge.length <= 30,
        },
        {
            name: "message",
            message: "Please write a short message so we know how to help.",
            valid: details.message.length >= 10 && details.message.length <= 1500,
        },
    ];
    let isValid = true;
    checks.forEach((check) => {
        setFieldError(form, check.name, check.valid ? "" : check.message);
        if (!check.valid) {
            isValid = false;
        }
    });
    return isValid;
}
function setFieldError(form, name, message) {
    const field = form.elements.namedItem(name);
    if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) {
        return;
    }
    const error = document.getElementById(`${field.id}-error`);
    if (message === "") {
        field.removeAttribute("aria-invalid");
        field.removeAttribute("aria-describedby");
    }
    else {
        field.setAttribute("aria-invalid", "true");
        field.setAttribute("aria-describedby", `${field.id}-error`);
    }
    if (error) {
        error.textContent = message;
    }
}
function isValidSouthAfricanPhone(value) {
    const digits = value.replace(/\D/g, "");
    if (digits.length === 10 && digits.startsWith("0")) {
        return true;
    }
    if (digits.length === 11 && digits.startsWith("27")) {
        return true;
    }
    return false;
}
function buildMailtoLink(details) {
    const subject = "Enquiry for Mbele ECD English Creche";
    const body = [
        `Parent/Guardian: ${details.parentName}`,
        `Phone: ${details.phoneNumber}`,
        `Email: ${details.email}`,
        `Child's Age: ${details.childAge}`,
        "",
        details.message,
    ].join("\n");
    return `mailto:${CRECHE_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
initWebsite();
