// function to check login 
function checkLogin(response) {
    if (response.loginErr) location.replace('/login')
}
/*function to load usefull datas*/
let allStore = null
$.ajax({
    url: '/getdata',
    method: 'get',
    success: (data => {
        checkLogin(data)
        if (data) allStore = data
    }),
    error: (err => alert('sorry some error on the server'))
})
// function to post data to register a user 
$('#register-user').submit(e => {
    e.preventDefault()
    showLoading()
    $.ajax({
        url: '/register',
        method: 'post',
        data: $('#register-user').serialize(),
        success: (result => {
            hideLoading()
            if (result.err) alert(result.err)
            else document.querySelector('.otp-veryfiy').style.visibility = 'visible'
        })
    })
})
// function to resend otp 
function resndOtp(e) {
    e.preventDefault()
    showLoading()
    $.ajax({
        url: '/register',
        method: 'post',
        data: { resend: 'ok' },
        success: (result => {
            hideLoading()
            alert('otp has resended')

        })
    })
}
// function to verify otp 
$('#veryfy-otp').submit(e => {
    e.preventDefault()
    showLoading()
    $.ajax({
        url: '/register',
        method: 'post',
        data: $('#veryfy-otp').serialize(),
        success: (result => {
            hideLoading()
            if (result.err) alert('entered otp is incorect please check or click on resend')
            else if (result) location.replace('/')


        })
    })
})
// function to show all store when user search 
function showStore(value) {
    let sugessionStore = []

    let sugessionDiv = document.getElementById('showStore')
    if (value == '') sugessionDiv.style.display = 'none'
    else {
        allStore.forEach(store => {
            if (value.toLowerCase() == store.location.slice(0, value.length).toLowerCase()) sugessionStore.push(store)
        })
        if (sugessionStore.length == 0) {
            sugessionDiv.style.display = 'block'
            sugessionDiv.innerHTML = `<p class="heading">All stores</p> 
                                     <p class="noitem"><i class="far fa-frown"></i> Sorry no items to display ...</p>`
        }
        else if (sugessionStore.length > 0) {
            sugessionDiv.style.display = 'block'
            sugessionDiv.innerHTML = '<p class="heading">All stores</p>'
            sugessionStore.forEach(store => {
                let newDiv = document.createElement('div')
                newDiv.classList = 'card'
                newDiv.innerHTML = ` <p class="topic"><i class="fas fa-store-alt"></i> ${store.store}</p>
                                     <p class="location">${store.location} </p>
                                    <p class="address">${store.address} </p>
                                     <button onclick="location.replace('/store/${store._id}')">Shop Now</button>`
                sugessionDiv.append(newDiv)
            })
        }
    }
}