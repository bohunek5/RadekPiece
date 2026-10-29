// Project access screen for the static presentation. No credentials in URLs.
const ACCESS_DIGEST='8d23cf6c86e834a7aa6eded54c26ce2bb2e74903538c61bdd5d2197997ab2f72';
const projects={
 antila:{name:'Antila 33.3',key:'radek-antila-access-v1',path:'./antila/'},
 piece:{name:'KOSTRZEWA',key:'radek-piece-v1',path:'./piece/'}
};
const form=document.querySelector('#project-login-form');
const login=document.querySelector('#project-login');
const password=document.querySelector('#project-password');
const message=document.querySelector('#access-message');
const note=document.querySelector('#selection-note');
const submit=form.querySelector('button[type=submit]');
const cards=[...document.querySelectorAll('[data-project]')];
let busy=false;

function clearError(){
 login.removeAttribute('aria-invalid');
 password.removeAttribute('aria-invalid');
 message.textContent='';
 message.classList.remove('success');
}

function showSelection(id){
 const project=Object.hasOwn(projects,id)?projects[id]:null;
 cards.forEach(card=>{
  const selected=card.dataset.project===id;
  card.setAttribute('aria-pressed',String(selected));
  card.closest('.project-card').classList.toggle('selected',selected);
 });
 note.textContent=project?`Wybrany projekt: ${project.name}.`:'Wybierz kartę lub wpisz login projektu.';
 submit.querySelector('span').textContent=project?`Otwórz ${project.name}`:'Otwórz projekt';
}

cards.forEach(card=>card.addEventListener('click',()=>{
 if(busy)return;
 login.value=card.dataset.project;
 clearError();showSelection(login.value);
 password.focus({preventScroll:true});
 if(matchMedia('(max-width: 850px)').matches)document.querySelector('.access-panel').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
}));
login.addEventListener('input',()=>{clearError();showSelection(login.value.trim().toLowerCase());});
password.addEventListener('input',clearError);

function setBusy(value){
 busy=value;submit.disabled=value;login.readOnly=value;password.readOnly=value;
 cards.forEach(card=>card.disabled=value);
}

form.addEventListener('submit',async event=>{
 event.preventDefault();if(busy)return;
 clearError();
 const id=login.value.trim().toLowerCase();
 const project=Object.hasOwn(projects,id)?projects[id]:null;
 if(!project){
  login.setAttribute('aria-invalid','true');
  message.textContent='Nieznany login. Wpisz „antila” albo „piece”.';
  login.focus();login.select();return;
 }
 login.value=id;showSelection(id);setBusy(true);message.textContent='Sprawdzam dostęp…';
 try{
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(password.value));
  const value=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
  if(value!==ACCESS_DIGEST){
   setBusy(false);password.setAttribute('aria-invalid','true');
   message.textContent='Nieprawidłowe hasło. Spróbuj ponownie.';
   password.focus();password.select();return;
  }
  try{
   Object.values(projects).forEach(item=>sessionStorage.removeItem(item.key));
   sessionStorage.setItem(project.key,ACCESS_DIGEST);
  }catch{
   setBusy(false);message.textContent='Przeglądarka nie pozwala zapisać sesji. Zezwól na pamięć witryny i spróbuj ponownie.';return;
  }
  password.value='';message.textContent=`Otwieram projekt ${project.name}…`;message.classList.add('success');
  submit.querySelector('span').textContent='Otwieram studio…';
  location.assign(project.path);
 }catch(error){
  console.error('Nie udało się otworzyć projektu.',error);
  setBusy(false);message.textContent='Nie udało się sprawdzić dostępu. Odśwież stronę i spróbuj ponownie.';
 }
});

const parameters=new URLSearchParams(location.search);
if(parameters.get('logout')==='1'){
 try{Object.values(projects).forEach(project=>sessionStorage.removeItem(project.key));message.textContent='Sesja została wyczyszczona.';message.classList.add('success');}
 catch{message.textContent='Przeglądarka nie pozwala wyczyścić sesji. Zamknij tę kartę, aby zakończyć sesję.';}
}
const preselection=parameters.get('project');
if(Object.hasOwn(projects,preselection)){login.value=preselection;showSelection(preselection);}
