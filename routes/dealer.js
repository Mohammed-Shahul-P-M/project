const router = require('express').Router()
const dealerDbfunction = require('./dbfunction/dealerdbFunction')
const fs = require('fs')
const path = require('path')
var Dealer = null
let dealerRequestedUrl = '/dealer/dashboard'
let errmsg = null
var data = {}
let DoesChangeHappen = true
// function to veryfiyDealer
async function verifyDealer(req, res, next) {
    if (req.session.dealerId) {
        if (DoesChangeHappen) {
            Dealer = await dealerDbfunction.getAlldata(req.session.dealerId)
            DoesChangeHappen = false
            req.session.dealerId = Dealer._id
        }
        next()
    }
    else {
        if (req.url == '/dashboard') {
            errmsg = 'Sorry session is timed Out'
            dealerRequestedUrl = '/dealer' + req.url
            res.redirect('/dealer')
        } else res.json({ loginErr: 'Session timed out' })

    }
}

// login route for dealer
router.get('/', (req, res) => {

    if (req.session.dealerId) {
        res.redirect('/dealer/dashboard')
        // console.log(req.session.dealer);
    }
    else res.render('login', { route: '/dealer/', errmsg, signuproute: '/dealer/signup', formHeading: 'Dealer login' })
    errmsg = null
})
router.post('/', (req, res) => {
    if (req.session.dealerId) res.redirect('/dealer/dashboard')
    else {
        dealerDbfunction.doLogin(req.body).then(dealer => {
            if (dealer) {
                req.session.dealerId = dealer._id
                Dealer = dealer
                res.redirect(dealerRequestedUrl)
            } else {
                errmsg = 'password or name is wrong'
                res.redirect('/dealer')
            }
        })
    }
})
// route for dashboard of dealer 
router.get('/dashboard', verifyDealer, (req, res) => {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1')
    res.header('Pragma', 'no-cache')
    res.render('dealer/dashboard', { dealer: Dealer })
})
// route to edit dealer info  from dealer dashboard 
router.post('/edit-dealerinfo', verifyDealer, async (req, res) => {
    let data = req.body
    let proPic = null
    delete data.email
    if (req.files) proPic = req.files.image
    function editDealer() {
        dealerDbfunction.editDealerInfo(data, Dealer._id).then(result => {
            let oldPic = null
            if (data.proPic) {
                if (Dealer.profilePic) {
                    oldPic = path.join(__dirname, '../public/images/pro-pics', Dealer.ProfilePic)
                    path.unlink(oldPic, err => { if (err) console.log(err); })
                }
            }
            Dealer = result
            res.json('deatails editted')
        })
    }
    if (proPic) {

        proPic.mv('./public/images/pro-pics/' + proPic.name, (err, done) => {
            if (!err) data.profilePic = proPic.name
            editDealer()
        })
    } else editDealer()


})

// route for posting data to add a product
router.post('/add-product', verifyDealer, (req, res) => {
    let data = req.body
    let dealerId = req.session.dealerId
    const productimage = req.files.img
    data.price = parseFloat(data.price)
    data.stock = parseInt(data.stock)
    if (productimage) {
        let productname = Date.now() + productimage.name
        productimage.mv('./public/images/products/' + productname, (err, done) => {
            if (!err) {
                data.prodImage = productname
                dealerDbfunction.createProduct(data, dealerId).then(result => {
                    let products = result.value.products
                    res.json(products[products.length - 1])
                }).catch(err => res.json({ errmsg: 'sorry error occured' }))
            }
            else console.log(err);
        })
    } else res.json('no images')
})
// rote to edit a specific product
router.post('/edit/product', verifyDealer, (req, res) => {
    let image = null
    imageName = null
    let data = req.body;
    delete data.stock
    data.price = parseFloat(data.price)
    dealerDbfunction.UpdateProduct(data, req.session.dealerId).then(results => {
        Dealer.products[data.index] = results[data.index]
        if (req.files) {     // if there is an image to change
            image = req.files.img
            imageName = Date.now() + image.name
            // saving new image to the server
            image.mv('./public/images/products/' + imageName, (err, done) => {
                if (!err) {
                    dealerDbfunction.updateImageName(imageName, data.id, req.session.dealerId).then(result => {
                        res.json(result[data.index])
                        Dealer.products[data.index] = result[data.index]
                        // removing old image
                        let directory = path.join(__dirname, '..', 'public/images/products/', results[data.index].prodImage)
                        fs.unlink(directory, err => {
                            if (err) console.log(err);
                        })
                    })
                } else res.json({ data: results[data.index], imgErr: 'some error occured while uploading image' })
            })
        } else res.json(results[data.index])
    })
})
//function to add stock to the server
router.post('/addStocks', verifyDealer, (req, res) => {
    req.body.stock = parseInt(req.body.stock)
    Dealer.products[req.body.index].stock += req.body.stock
    dealerDbfunction.addStock(req.body, req.session.dealerId).then(result => {
        res.json(result[req.body.index])
    })

})
// route to update timing of the shop 
router.post('/update-time', verifyDealer, (req, res) => {
    let open = `${req.body.hr[0]}:${req.body.mn[0]}:${req.body.ampm[0]}`
    let close = `${req.body.hr[1]}:${req.body.mn[1]}:${req.body.ampm[1]}`
    let data = { open: open, close: close }
    dealerDbfunction.updateTime(data, req.session.dealerId).then(result => {
        if (result) {
            res.json({ open: result.open, close: result.close })
            Dealer.open = result.open
            Dealer.close = result.close
        }
    })
})
// route to close or open the shop 
router.post('/close-shop', verifyDealer, (req, res) => {
    let openStatus = false
    if (req.body.status == 'true') openStatus = true
    dealerDbfunction.closeShop({ openStatus: openStatus }, req.session.dealerId).then(result => {
        res.json(result.value.openStatus)
        Dealer.openStatus = result.value.openStatus
    })
})
//route to desable a product
router.post('/disable', verifyDealer, (req, res) => {
    dealerDbfunction.disableProduct(req.body, req.session.dealerId).then(response => {
        if (response) {
            res.json('success')
            Dealer.products = response
        }

    }).catch(err => res.json({ errmsg: 'sorry error occured' }))
})
//route to delete a specific product
router.delete('/delete/product', verifyDealer, (req, res) => {

    dealerDbfunction.deleteProduct(req.body.id, req.session.dealerId).then(result => {
        // console.log(result);
        DoesChangeHappen = true
        res.json('ok success')
        let imagePath = path.join(__dirname, '../public', req.body.imgsrc)
        fs.unlink(imagePath, err => { if (err) console.log(err) })
    })

})
// rote to serve essential datas to the page 
router.get('/getdata', verifyDealer, (req, res) => {
    data.catogorylist = Dealer.catogories
    data.products = Dealer.products
    res.json(data)
})
// route to update catogory list 
router.post('/updatecatogory', verifyDealer, (req, res) => {

    dealerDbfunction.updateCatogory(req.body.catogory, req.session.dealerId)
    Dealer.catogories.push(req.body.catogory)
    res.json('ok')

})
// route to change password 
router.post('/change-password', verifyDealer, (req, res) => {
    dealerDbfunction.changePassword(req.body, req.session.dealerId).then(result => {
        res.json(result)
    })
})
// roter to logout 
router.get('/logout', (req, res) => {
    req.session.destroy()
    res.redirect('/dealer')
})
module.exports = router