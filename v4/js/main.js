/* ============================================================
   KOZA Mountain Resort — site interactions
   ============================================================ */
(function(){
  "use strict";

  /* ---------- Header state ---------- */
  var header = document.getElementById("header");
  if(header){
    var onScroll = function(){
      header.classList.toggle("scrolled", window.scrollY > 40);
    };
    window.addEventListener("scroll", onScroll, {passive:true});
    onScroll();
  }

  /* ---------- Mobile menu ---------- */
  var burger = document.getElementById("burger");
  var nav = document.getElementById("nav");
  if(burger && nav){
    burger.addEventListener("click", function(){
      var open = nav.classList.toggle("mobile-open");
      burger.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.classList.toggle("menu-open", open);
      document.body.style.overflow = open ? "hidden" : "";
    });
    nav.addEventListener("click", function(e){
      if(e.target.tagName === "A" && nav.classList.contains("mobile-open")){
        nav.classList.remove("mobile-open");
        burger.classList.remove("open");
        burger.setAttribute("aria-expanded","false");
        document.body.classList.remove("menu-open");
        document.body.style.overflow = "";
      }
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealObserver = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, {threshold: 0.14, rootMargin: "0px 0px -40px 0px"});
  document.querySelectorAll(".reveal").forEach(function(el){
    revealObserver.observe(el);
  });

  /* ---------- Animated counters ---------- */
  function animateCounter(el){
    var target   = parseFloat(el.dataset.count);
    var decimals = parseInt(el.dataset.decimals || "0", 10);
    var suffix   = el.dataset.suffix || "";
    var duration = 1800;
    var start    = null;
    function frame(ts){
      if(!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = (target * eased).toFixed(decimals).replace(".", ",");
      el.textContent = val + suffix;
      if(p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  var counterObserver = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, {threshold: 0.6});
  document.querySelectorAll("[data-count]").forEach(function(el){
    counterObserver.observe(el);
  });

  /* ---------- Season tabs ---------- */
  var seasonBtns = document.querySelectorAll(".season-btn");
  seasonBtns.forEach(function(btn){
    btn.addEventListener("click", function(){
      seasonBtns.forEach(function(b){
        b.classList.remove("active");
        b.setAttribute("aria-selected","false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-selected","true");
      document.querySelectorAll(".season-panel").forEach(function(p){
        p.classList.remove("active");
      });
      var panel = document.getElementById("panel-" + btn.dataset.season);
      if(panel){
        panel.classList.add("active");
        panel.querySelectorAll(".reveal").forEach(function(el){
          el.classList.add("visible");
        });
      }
    });
  });

  /* ---------- Smooth anchors with header offset (тільки #-посилання) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function(link){
    link.addEventListener("click", function(e){
      var id = link.getAttribute("href");
      if(id.length < 2) return;
      var target = document.querySelector(id);
      if(!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({top: top, behavior: "smooth"});
    });
  });

  /* ============================================================
     BOOKING FORM (головна сторінка)
     ============================================================ */
  var bookingForm = document.getElementById("bookingForm");
  if(bookingForm){
    var ROOMS = {
      standard: {name: "Стандарт «Смерека»",   price: 2400, cap: 2},
      family:   {name: "Сімейний «Полонина»",  price: 3200, cap: 4},
      junior:   {name: "Напівлюкс «Горгани»",  price: 3900, cap: 3},
      cottage:  {name: "Котедж «Козачка»",     price: 5900, cap: 6}
    };

    var inDate   = bookingForm.querySelector('[name="checkin"]');
    var outDate  = bookingForm.querySelector('[name="checkout"]');
    var guests   = bookingForm.querySelector('[name="guests"]');
    var roomSel  = bookingForm.querySelector('[name="room"]');
    var sumNights = document.getElementById("sumNights");
    var sumPrice  = document.getElementById("sumPrice");

    /* мінімальні дати: заїзд — сьогодні, виїзд — завтра */
    function fmt(d){ return d.toISOString().slice(0,10); }
    var today = new Date();
    var tomorrow = new Date(today.getTime() + 864e5);
    inDate.min = fmt(today);
    outDate.min = fmt(tomorrow);
    if(!inDate.value)  inDate.value  = fmt(today);
    if(!outDate.value) outDate.value = fmt(tomorrow);

    /* передвибір номера через ?room= (посилання зі сторінки «Номери») */
    var params = new URLSearchParams(window.location.search);
    var pre = params.get("room");
    if(pre && ROOMS[pre]) roomSel.value = pre;

    function nights(){
      var a = new Date(inDate.value), b = new Date(outDate.value);
      var n = Math.round((b - a) / 864e5);
      return (isFinite(n) && n > 0) ? n : 0;
    }
    function plural(n){
      var m10 = n % 10, m100 = n % 100;
      if(m10 === 1 && m100 !== 11) return "ніч";
      if(m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "ночі";
      return "ночей";
    }
    function money(n){
      return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }
    function updateSummary(){
      var n = nights();
      var room = ROOMS[roomSel.value];
      if(n > 0 && room){
        sumNights.textContent = n + " " + plural(n) + " · " + room.name;
        sumPrice.textContent = money(n * room.price) + " грн";
      }else{
        sumNights.textContent = "Оберіть коректні дати";
        sumPrice.textContent = "—";
      }
    }
    inDate.addEventListener("change", function(){
      var next = new Date(new Date(inDate.value).getTime() + 864e5);
      outDate.min = fmt(next);
      if(new Date(outDate.value) <= new Date(inDate.value)) outDate.value = fmt(next);
      updateSummary();
    });
    outDate.addEventListener("change", updateSummary);
    roomSel.addEventListener("change", updateSummary);
    guests.addEventListener("change", updateSummary);
    updateSummary();

    bookingForm.addEventListener("submit", function(e){
      e.preventDefault();
      var n = nights();
      if(n < 1){ inDate.reportValidity(); return; }
      var room = ROOMS[roomSel.value];
      var body =
        "Заявка на бронювання KOZA Mountain Resort%0D%0A%0D%0A" +
        "Заїзд: "   + inDate.value  + "%0D%0A" +
        "Виїзд: "   + outDate.value + "%0D%0A" +
        "Ночей: "   + n + "%0D%0A" +
        "Гостей: "  + guests.value + "%0D%0A" +
        "Номер: "   + encodeURIComponent(room.name) + "%0D%0A" +
        "Орієнтовна вартість: " + (n * room.price) + " грн";
      window.location.href =
        "mailto:booking@kozaresort.ua" +
        "?subject=" + encodeURIComponent("Бронювання — KOZA Mountain Resort") +
        "&body=" + body;
      var ok = document.getElementById("bookingOk");
      if(ok) ok.classList.add("show");
    });
  }

  /* ============================================================
     CONTACT FORM (сторінка контактів, mailto handoff)
     ============================================================ */
  var contactForm = document.getElementById("contactForm");
  if(contactForm){
    contactForm.addEventListener("submit", function(e){
      e.preventDefault();
      var f = e.target;
      if(!f.name.value.trim() || !f.email.value.trim()){
        f.name.reportValidity();
        f.email.reportValidity();
        return;
      }
      var body =
        "Ім'я: "    + f.name.value.trim()  + "%0D%0A" +
        "Email: "   + f.email.value.trim() + "%0D%0A" +
        "Телефон: " + (f.phone.value.trim() || "—") + "%0D%0A%0D%0A" +
        encodeURIComponent(f.message.value.trim());
      window.location.href =
        "mailto:booking@kozaresort.ua" +
        "?subject=" + encodeURIComponent("KOZA Mountain Resort — запит із сайту") +
        "&body=" + body;
      var ok = document.getElementById("formOk");
      if(ok) ok.classList.add("show");
    });
  }

  /* ---------- Year ---------- */
  var year = document.getElementById("year");
  if(year) year.textContent = new Date().getFullYear();
})();
