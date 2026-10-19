(function(){var d=document.documentElement;
var tk=false;function upd(){tk=false;if((window.scrollY||0)>12)d.classList.add('scrolled');else d.classList.remove('scrolled')}
upd();window.addEventListener('scroll',function(){if(!tk){tk=true;requestAnimationFrame(upd)}},{passive:true});
if(!('IntersectionObserver' in window))return;
var reduced=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var rv=document.querySelectorAll('.rv');
if(!reduced){d.classList.add('js');var left=rv.length;var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('seen');io.unobserve(e.target);left--}});if(left<=0)io.disconnect()},{rootMargin:'0px 0px -8% 0px'});rv.forEach(function(el){io.observe(el)})}
var links={};document.querySelectorAll('.toc a[href^="#"]').forEach(function(a){links[a.getAttribute('href').slice(1)]=a});
var so=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting&&links[e.target.id]){for(var k in links){links[k].classList.remove('on');links[k].removeAttribute('aria-current')}links[e.target.id].classList.add('on');links[e.target.id].setAttribute('aria-current','location')}})},{rootMargin:'-20% 0px -70% 0px'});
document.querySelectorAll('main section[id]').forEach(function(s){so.observe(s)})})();
