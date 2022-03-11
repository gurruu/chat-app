const formbtn = document.querySelector(".submit");
const input = document.querySelector(".message");
const locationBtn = document.querySelector(".location");
const messageContainer=document.querySelector('.container')
const sudebarContainer=document.querySelector('.sidebar')


// templates
const messageTemplates=document.querySelector('.message-template').innerHTML
const loctaionmessageTemplates = document.querySelector(".location-message-template").innerHTML;
const sideBarTemplate = document.querySelector(".room-members").innerHTML


// OPTIONS
const {username, room}=Qs.parse(location.search,{ignoreQueryPrefix:true})


const autoScroll=()=>{
const newMessage=messageContainer.lastElementChild

// height of new container
const newMessageStyles=getComputedStyle(newMessage)
const newMessageMargin=parseInt(newMessageStyles.marginBottom)
const newMessageHeight=newMessage.offsetHeight+newMessageMargin

// visible height
const visibleHeight=messageContainer.offsetHeight

// height of messages contaoner
const containerHeight=messageContainer.scrollHeight

// how far have i scrollrd?
const scrollOffset=messageContainer.scrollTop+visibleHeight

if(containerHeight-newMessageHeight <= scrollOffset){
  messageContainer.scrollTop=messageContainer.scrollHeight

}
}


const socket = io();

socket.on("message", (message) => {
  // console.log(message.username);
  const html=Mustache.render(messageTemplates,{
    username:message.username,
    message:message.text,
    createdAt:moment(message.createdAt).format('h:mm a')
  })
  messageContainer.insertAdjacentHTML('beforeend',html)
  autoScroll()
});

socket.on("locationMessage",(message)=>{
    const html = Mustache.render(loctaionmessageTemplates, {
      url: message.url,
      createdAt: moment(message.createdAt).format("h:mm a"),
    });
    messageContainer.insertAdjacentHTML("beforeend", html);
    autoScroll()
});

socket.on('roomData',({room,users})=>{
  const html=Mustache.render(sideBarTemplate,{
    room,
    users
  })
  sudebarContainer.innerHTML=html
})

formbtn.addEventListener("click", (e) => {
  e.preventDefault();
  socket.emit("nextChat", input.value,(error)=>{
    input.value=''
    input.focus()
  if(error){
    return console.log(error)
  }
  console.log('message delivered')
  });
  
});

locationBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("geolocation not supported");
  }
 locationBtn.setAttribute('disabled','disabled')
  navigator.geolocation.getCurrentPosition((pos) => {
    
    socket.emit("sendLocation", {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
    },()=>{
      locationBtn.removeAttribute("disabled");
      console.log('location shared')
    });
  });
});

socket.emit('join',{username,room},(error)=>{
  if(error){
    alert(error)
    location.href='/'
  }
})