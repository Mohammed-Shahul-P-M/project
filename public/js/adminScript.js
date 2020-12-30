// function to check is user logged out from the server
function checklogin(response, next) {
    if (response.loginerr) location.reload()
    else next()
}

// storing all dealer data from the server for better perfomance
let alldealers = null
$.ajax({
    url: '/admin/getdealers',
    method: 'get',
    success: (response => alldealers = response)
})
//function to update element dynamicaly
function updateElement(id, query, atributes, data) {
    let element = null
    if (query) {
        element = document.getElementById(id).querySelector(query)
    } else element = document.getElementById(id)
    if (atributes) {
        for (var key in atributes) {
            element.setAttribute(key, atributes[key])
        }
    }
    if (data) element.innerHTML = data
}
// function to show a specific div along with hide some divs
function showDiv(Id) {

    let divids = ['dealer-details', 'add-dealer', 'settings', 'edit-dealer']
    divids.forEach(id => document.getElementById(id).style.display = 'none')
    document.getElementById(Id).style.display = 'block'
}
// function to load dealer details to the form for editing
function editDealer(Id) {
    function findById(data) {
        return data._id == Id
    }
    let dealerData = alldealers.find(findById)
    // updating the edit form with proper data
    let keys = ['name', 'email', 'store', 'location', 'phone', '_id',]
    keys.forEach((key, i) => updateElement('edit-form-' + i, null, { 'value': dealerData[key] }))

    updateElement('edit-form-6', null, null, dealerData.address)
}
// function to edit dealer details through ajax
$('#edit-dealer-form').submit(e => {
    e.preventDefault()
    showLoading()
    $.ajax({
        url: '/admin/editDealer',
        method: 'post',
        data: $('#edit-dealer-form').serialize(),
        success: (response => {
            hideLoading()
            checklogin(response, () => {
                var x = document.getElementById(response._id)
                // x.querySelector('p.dealer-name').innerHTML = response.name + '<br><br>' + response.phone
                // x.querySelector('p.address').innerHTML = '<strong>' + response.store + '</strong><br><br>' + response.address
                doesChangeOccure = true
                showSnackbar('editted Deatails of ' + response.name)

            })
        })
    })
})
// function to add new dealer
$('#add-dealer-form').submit(e => {
    e.preventDefault()
    showLoading()
    $.ajax({
        url: '/admin/createDealer',
        method: 'post',
        data: $('#add-dealer-form').serialize(),
        success: (response => {
            hideLoading()
            checklogin(response, () => {
                if (response.err) showSnackbar(response.err)
                else {
                    doesChangeOccure = true
                    $('#add-dealer-form')[0].reset()
                    showSnackbar(response.name + ' added as a dealer')
                }
            })
        })
    })
})
// function to delete a dealer 
function deleteDealer(id, name, classname) {
    let r = confirm('Do you want to delete the dealer ' + name)
    if (r) {

        $.ajax({
            url: '/admin/deletedealer',
            method: 'post',
            data: { id: id },
            success: (response => {

                checklogin(response, () => {
                    // changing the count on the website
                    document.getElementById(id).remove()
                    let count = parseInt(document.querySelector('div>p.total').innerHTML)
                    document.querySelector('div>p.total').innerHTML = count - 1
                    if (classname) {
                        let anothercount = parseInt(document.querySelector('div>p.' + classname).innerHTML)
                        document.querySelector('div>p.' + classname).innerHTML = anothercount - 1
                    }

                })
            })
        })
    }

}
// function to ban or unban a dealer 
function statuschange(value, id) {

    $.ajax({
        url: '/admin/dealerstatus/',
        data: { banned: value, id },
        method: 'post',
        success: (result => {
            checklogin(result, () => {
                var bannedDiv = document.getElementById(id)
                bannedDiv.remove()
                if (value == 'ban') {
                    bannedDiv.querySelectorAll('p.action>i')[2].setAttribute('class', "icon fas fa-check-double")
                    bannedDiv.querySelectorAll('p.action>i')[2].setAttribute('onclick', `statuschange('unban','${id}')`)
                    bannedDiv.querySelectorAll('p.action>i')[2].style.color = 'rgb(8,182,8)'
                    document.getElementById('settings').appendChild(bannedDiv)
                    showSnackbar(result.name + ' is banned')
                } else if (value == 'unban') {
                    bannedDiv.querySelectorAll('p.action>i')[2].setAttribute('class', "icon fas fa-ban")
                    bannedDiv.querySelectorAll('p.action>i')[2].setAttribute('onclick', `statuschange('ban','${id}')`)
                    bannedDiv.querySelectorAll('p.action>i')[2].style.color = 'orange'
                    document.getElementById('dealer-details').appendChild(bannedDiv)
                    showSnackbar(result.name + ' is removed from banned list')
                    doesChangeOccure = true
                }
            })
        })
    })
}
// function to disable or enable the app 
function disableApp(value) {
    $.ajax({
        url: '/admin/disable',
        method: 'post',
        data: { status: value },
        success: (result => {
            checklogin(result, () => {

                if (value == 'yes') {
                    let data = 'App is currently disabled please check the button to enable'
                    updateElement('settings', 'div.disable-button>p', { style: 'color:red;' }, data)
                    updateElement('settings', 'div>label>input', { onclick: 'disableApp("no")' })

                } else if (value == 'no') {
                    let data = 'uncheck the button to disable the app'
                    updateElement('settings', 'div.disable-button>p', { style: 'color:grey;' }, data)
                    updateElement('settings', 'div>label>input', { onclick: 'disableApp("yes")' })

                }
            })
        })
    })
}

// function to update admin details   from admin-panel.hbs at  71 
$('#edit-admin').submit(e => {
    e.preventDefault()
    showLoading()
    $.ajax({
        url: '/admin/update',
        data: $('#edit-admin').serialize(),
        method: 'post',
        success: (response => {
            hideLoading()
            if (response.name) {

                $('#edit-admin')[0].reset()
                showSnackbar('admin data editted')
            } else checklogin(response)
        })
    })
})
