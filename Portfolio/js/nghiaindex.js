
//scrolling color efect
window.addEventListener("scroll", function () {
    if (window.scrollY > 1600) {
        document.body.classList.add("theme-1600");
        document.body.classList.remove("theme-1000", "theme-300", "theme-default");
    } else if (window.scrollY > 1000) {
        document.body.classList.add("theme-1000");
        document.body.classList.remove("theme-1600", "theme-300", "theme-default");
    } else if (window.scrollY > 300) {
        document.body.classList.add("theme-300");
        document.body.classList.remove("theme-1600", "theme-1000", "theme-default");
    } else {
        document.body.classList.add("theme-default");
        document.body.classList.remove("theme-1600", "theme-1000", "theme-300");
    }
});

//scrolling up effect
document.addEventListener("DOMContentLoaded", function () {
    const linkContainer = document.querySelector(".link-container");

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                linkContainer.classList.add("show");
            } else {
                linkContainer.classList.remove("show"); // Remove class when out of view
            }
        });
    }, { threshold: 0.3 });

    observer.observe(linkContainer);
});

//gsap aboutme
document.addEventListener("DOMContentLoaded", function () {
    gsap.registerPlugin(ScrollTrigger);

    let tl = gsap.timeline({
        scrollTrigger: {
            trigger: ".about-section",
            start: "top 40%", // Bắt đầu khi phần about-section vào 70% màn hình
            end: "top 1%",
            toggleActions: "play reverse play reverse", // Cuộn xuống chạy, cuộn lên đảo ngược
        }
    });

    // Ảnh di chuyển sang trái (giữ nguyên opacity = 1)
    tl.to(".about-image", {
        x: "-150px", // Di chuyển sang trái
        duration: 1.5,
        ease: "power2.out",
    });

    // Chữ hiện dần từ sau ảnh và di chuyển sang phải
    tl.to(".about-text", {
        x: "100px", // Di chuyển sang phải
        opacity: 1, // Hiện chữ
        duration: 1,
        ease: "power2.out"
    }, "-=1"); // Bắt đầu sau ảnh 0.5 giây
});
//typingtxt
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!~@#$%^&*";
let interval = null;

// Hàm tạo hiệu ứng
function startGlitchEffect(element) {
    let iteration = 0;
    const originalText = element.dataset.value;
    let interval = null;

    clearInterval(interval);

    interval = setInterval(() => {
        element.innerText = originalText
            .split("")
            .map((letter, index) => {
                if (index < iteration) {
                    return originalText[index];
                }
                return letters[Math.floor(Math.random() * 35)];
            })
            .join("");

        if (iteration >= originalText.length) {
            clearInterval(interval);
        }

        iteration += 1 / 3;
    }, 50);
}

// Thiết lập Intersection Observer
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            setTimeout(() => {
                startGlitchEffect(entry.target);
                observer.unobserve(entry.target);
            }, );
        }
    });
}, { threshold: 0.5 }); // Kích hoạt khi 50% phần tử hiển thị

// Áp dụng cho tất cả phần tử có class "typing-txt"
document.querySelectorAll(".typing-txt").forEach(element => {
    observer.observe(element);
});
//icon
document.addEventListener("DOMContentLoaded", function () {
    const techIcons = document.getElementById("techIcons");

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    techIcons.classList.add("show");
                }, 7000); // 7 giây sau khi thấy phần tử
                observer.unobserve(techIcons); // Ngừng quan sát sau khi đã kích hoạt
            }
        });
    }, { threshold: 0.5 }); // Kích hoạt khi 50% phần tử xuất hiện

    observer.observe(techIcons);
});

// Gsap moreAboutMe
import {interiors} from "./dataGsap.js";
document.addEventListener("DOMContentLoaded", function () {
    const cursor = document.querySelector(".cursor");
    const numberOfItems = 6; // FIXED VARIABLE NAME
    const radius = 1100;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const angleIncrement = (2 * Math.PI) / numberOfItems;

    for (let i = 0; i < numberOfItems; i++) {
        const item = document.createElement("div");
        item.className = "item";
        const p = document.createElement("p");
        const count = document.createElement("span");

        p.textContent = interiors[i].name;
        count.textContent = `(${Math.floor(Math.random() * 50) + 1})`;

        item.appendChild(p);
        p.appendChild(count);
        cursor.appendChild(item);

        const angle = i * angleIncrement;
        const x = centerX +radius * Math.cos(angle);
        const y = centerY +radius * Math.sin(angle);

        const rotation =(angle*180)/Math.PI;

        gsap.set(item,{
            x: x+"px",
            y: y+"px",
            rotation: rotation,

        })}
});
