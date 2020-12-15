// const image = document.getElementById('personalinfo-pro')
// const cropper = new Cropper(image, {
//     aspectRatio: 9 / 9,
//     crop(event) {
//         console.log(event.detail.x);
//         console.log(event.detail.y);
//         console.log(event.detail.width);
//         console.log(event.detail.height);
//         console.log(event.detail.rotate);
//         console.log(event.detail.scaleX);
//         console.log(event.detail.scaleY);
//     }
// })
// essential function to dash board page
// function to close pop ups
function closePopup(id) {
    document.getElementById(id).style.visibility = 'hidden'
}
function changeImage(event, id) {
    if (id) document.getElementById(id).src = URL.createObjectURL(event.target.files[0])
    else document.querySelector('#edit-products>img').src = URL.createObjectURL(event.target.files[0])
}
function ShowTab(evt, tabId, classname, linkClass) {
    // Declare all variables
    var i, tablist, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tablist = document.getElementsByClassName(classname);
    for (i = 0; i < tablist.length; i++) {
        tablist[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName(linkClass);
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tabId).style.display = "block";
    evt.currentTarget.className += " active";
}
// middleware for succes function in ajax
function checkAuth(response) {
    if (response.loginErr) {
        console.log(response);
        location.reload()
    }

}

// loading essensial datas from the server
var datas;
$.ajax({
    url: '/dealer/getdata',
    method: 'get',
    success: (result => {
        checkAuth(result)
        datas = result
    }),
    error: (err => alert('resorses not loaded pleas reload the page'))
})
// function to update catogory 
function updateCatogory(data) {
    let foundcat = null
    datas.catogorylist.forEach(cata => {
        if (cata == data) foundcat = cata
    })
    if (!foundcat) {
        $.ajax({
            url: '/dealer/updatecatogory',
            method: 'post',
            data: { catogory: data },
            success: (result => {
                checkAuth(result)
                datas.catogorylist.push(data)
            })
        })
    }
}
// function for product section
//_________________________________________________________
// function to enable or disable a product
function changeStatus(e, value) {
    let id = e.target.getAttribute('data-id')
    let index = e.target.getAttribute('data-index')
    $.ajax({
        url: '/dealer/disable',
        method: 'post',
        data: { id: id, status: value, index: index },
        success: (result => {
            checkAuth(result)
            if (value == 'true') {
                e.target.innerText = 'Disable'
                e.target.setAttribute('onclick', 'changeStatus(event,"false")')
                e.target.setAttribute('style', 'background-color: rgb(174, 85, 2);')
                datas.products[index].status = true
            } else if (value == 'false') {
                e.target.innerText = 'Enable'
                e.target.setAttribute('onclick', 'changeStatus(event,"true")')
                e.target.setAttribute('style', 'background-color: rgb(2, 174, 162);')
                datas.products[index].status = false
            }
        })
    })
}
// function to delete product 
function deleteProduct(id) {
    let imgsrc = $('#' + id + '>img').attr('src')
    $.ajax({
        url: '/dealer/delete/product',
        data: { id: id, imgsrc: imgsrc },
        method: 'delete',
        success: (result => {
            checkAuth(result)
            showSnackbar(result)
            $('#' + id).remove()
            location.reload()
        })
    })
}
// function to show suggesion when dealer typing catogory
var reqDiv = document.getElementById('sugessiondiv')
function showSugession(e, value) {
    var catogories = datas.catogorylist  // loading list from the server 
    reqDiv.innerHTML = ''
    let foundCatogory = []
    let id = e.target.id
    catogories.forEach(cat => {
        if (value.toLowerCase() == '') reqDiv.style.visibility = 'hidden'
        else if (value.toLowerCase() == cat.toLocaleLowerCase().slice(0, value.length)) {
            foundCatogory.push(cat)
            let p = document.createElement('p')
            p.innerText = cat
            p.setAttribute('onclick', `setCatogory('${cat}','${id}')`)
            reqDiv.append(p)
            reqDiv.style.visibility = 'visible'
            reqDiv.style.left = e.target.offsetLeft + 'px'
            reqDiv.style.top = (e.target.offsetTop + e.target.offsetHeight) + 'px'
        }
        if (foundCatogory.length == 0) reqDiv.style.visibility = 'hidden'
    })

}
function setCatogory(value, id) {
    reqDiv.innerHTML = ''
    reqDiv.style.visibility = 'hidden'
    document.getElementById(id).value = value

}


// function to add products 
$('#addproduct').submit(e => {
    e.preventDefault()
    let formdata = new FormData(document.getElementById('addproduct'))
    $.ajax({
        url: '/dealer/add-product',
        method: 'post',
        data: formdata,
        cache: false,
        contentType: false,
        processData: false,
        dataType: 'json',
        success: (result => {
            checkAuth(result)
            if (result.errmsg) showSnackbar(result.errmsg)
            else {
                showSnackbar(result.name + ' added ')
                $('#addproduct')[0].reset()
                updateCatogory(result.catogory)
                let action = 'Enable'
                let bG = 'rgb(2, 174, 162)'
                status = true
                if (result.status) {
                    action = 'Disable'
                    status = false
                    bG = ' rgb(174, 85, 2)'
                }
                let newDiv = document.createElement('div')
                newDiv.id = result._id
                newDiv.className = 'product'
                newDiv.innerHTML = `<img src="/images/products/${result.prodImage}" alt="">
                <p class="name">${result.name} </p>
                <p class="catogory">${result.catogory}</p>
                <p class="price">${result.price} </p>
                <p class="stock">${result.stock} <span>${result.unit}</span> </p>
                <p class="action">
                    <button data-id="${result._id}" onclick="changeStatus(event,'${status}')"
                        style="background-color: ${bG};">${action}</button>
                   
                    <button onclick="showEditform(${datas.products.length})"
                        style="background-color: rgb(2, 174, 162);">Edit</button>
                    <button onclick="showAddStock(${datas.products.length})" style="background-color: black;">Stock</button>
                    <button onclick="deleteProduct('${result._id}')" style="background-color: black;">Delete</button>
                </p>`

                let parantDiv = document.getElementById('section-all-product')
                parantDiv.append(newDiv)
                datas.products.push(result)
            }
        }),
        error: (err => console.log(err))

    })
})
// function to show  edit form with value loded to edit a product 
function showEditform(index) {
    let product = datas.products[index]
    let editForm = document.getElementById('edit-products')
    editForm.querySelector('img').src = '/images/products/' + product.prodImage
    let inputs = editForm.querySelectorAll('.ok')
    inputs[0].value = product.name
    inputs[1].value = product.catogory
    inputs[2].value = product.price
    inputs[3].value = product.stock + " " + product.unit
    inputs[4].value = product._id
    inputs[5].value = index
    editForm.style.visibility = 'visible'
}
// functiion to edit a product 
$('#edit-products').submit(e => {
    e.preventDefault()
    let formdata = new FormData(document.getElementById('edit-products'))
    let index = formdata.get('index')
    $.ajax({
        url: '/dealer/edit/product',
        method: 'post',
        data: formdata,
        cache: false,
        contentType: false,
        processData: false,
        dataType: 'json',
        success: (response => {
            checkAuth(result)
            updateCatogory(result.catogory)
            if (response.imgErr) {
                showSnackbar('data edited but error in changing pics')
                datas.products[index] = response.data
                response = response.data
            }
            showSnackbar(response.name + ' editted')
            let editedDiv = document.getElementById(response._id)
            editedDiv.querySelector('img').src = '/images/products/' + response.prodImage
            let allP = editedDiv.querySelectorAll('p')
            allP[0].innerText = response.name
            allP[1].innerText = response.catogory
            allP[2].innerText = response.price
            allP[3].innerHTML = response.stock + ' <span>' + response.unit + '</span>'
            datas.products[index] = response
            closePopup('edit-products')
        })

    })
})
// function to show edit stock form 
function showAddStock(index) {
    let product = datas.products[index]
    let reqForm = document.getElementById('edit-stock')
    reqForm.style.visibility = 'visible'
    reqForm.querySelector('p.oldstock>span').innerText = product.stock
    reqForm.querySelector('input[name="id"]').value = product._id
    reqForm.querySelector('input[name="index"]').value = index
}
// function to add more stocks 
$('#edit-stock').submit(e => {
    e.preventDefault()
    let formdata = new FormData(document.getElementById('edit-stock'))
    $.ajax({
        url: '/dealer/addStocks',
        method: 'post',
        data: formdata,
        cache: false,
        contentType: false,
        processData: false,
        dataType: 'json',
        success: (result => {
            checkAuth(result)
            if (result) {
                let index = formdata.get('index')
                datas.products[index].stock += parseInt(formdata.get('stock'))
                closePopup('edit-stock')
                let edittedDiv = document.getElementById(result._id)
                let edittedElement = edittedDiv.querySelector('p.stock')
                edittedElement.innerHTML = result.stock + ` <span>${result.unit}</span> `
            }
        })
    })
})
// function to show edit form for update time 
function showUpdateTime(e) {
    e.preventDefault()
    document.getElementById('update-time').style.visibility = 'visible'
}
// function to update time 
$('#update-time').submit(e => {
    e.preventDefault()
    $.ajax({
        url: '/dealer/update-time',
        data: $('#update-time').serialize(),
        method: 'post',
        success: (result => {
            checkAuth(result)
            showSnackbar('Time updated')
            document.getElementById('openTime').value = result.open
            document.getElementById('closeTime').value = result.close
            closePopup('update-time')
        })
    })
})

// function to close or open the shop 
function closeShop(value) {
    $.ajax({
        url: '/dealer/close-shop',
        method: 'post',
        data: { status: value },
        success: (result => {
            checkAuth(result)
            if (result == true) {
                let toggleButten = document.getElementById('shop-status')
                let p = toggleButten.querySelector('p')
                p.innerText = 'Store is Live uncheck the button to close '
                p.style.color = 'gray'
                let input = toggleButten.querySelector('label>input')
                input.setAttribute('onclick', 'closeShop(false)')
            } else if (result == false) {
                let toggleButten = document.getElementById('shop-status')
                let p = toggleButten.querySelector('p')
                p.innerText = 'Store is closed check the button to open '
                p.style.color = 'red'
                let input = toggleButten.querySelector('label>input')
                input.setAttribute('onclick', 'closeShop(true)')
            }
        })
    })
}
// function to togle class
function toggleEdit() {
    let element = document.getElementById('edit-dealer-info')
    element.classList.toggle('inactive')
}
// function to edit dealer info 
$('#edit-dealer-info').submit(e => {
    e.preventDefault()
    formData = new FormData(document.getElementById('edit-dealer-info'))
    $.ajax({
        url: '/dealer/edit-dealerinfo',
        data: formData,
        method: 'post',
        cache: false,
        contentType: false,
        processData: false,
        dataType: 'JSON',
        success: (result => {
            checkAuth(result)
            showSnackbar(result)
            toggleEdit()
        }),
        error: (err => console.log(err))
    })
})
// function to show edit password form
function changePassword() {
    document.getElementById('edit-password').style.visibility = 'visible'
}
$('#edit-password').submit(e => {
    e.preventDefault()
    $.ajax({
        url: '/dealer/change-password',
        method: 'post',
        data: $('#edit-password').serialize(),
        success: (response => {
            checkAuth(response)
            if (response.err) showSnackbar(response.err)
            else {
                $('#edit-password')[0].reset()
                closePopup('edit-password')
                showSnackbar(response)
            }
        })
    })
})